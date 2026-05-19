import { Router } from "express";
import { Repositories } from "../repositories";
import { authMiddleware, requireRole, optionalAuthMiddleware, AuthRequest } from "../middleware/auth";
import { config } from "../config";
import { broadcastPendingTopic } from "./admin";

// FRM-TPC-005: Konu sahibi düzenleme süresi (24 saat)
const TOPIC_EDIT_WINDOW_MS = 24 * 60 * 60 * 1000;
// FRM-CMT-003: Yorum sahibi düzenleme süresi (15 dakika)
const COMMENT_EDIT_WINDOW_MS = 15 * 60 * 1000;

async function notifyStaff(repos: Repositories, fn: (staffIds: string[]) => Promise<void>): Promise<void> {
  try {
    const [admins, mods] = await Promise.all([
      repos.users.findByRole("admin"),
      repos.users.findByRole("moderator"),
    ]);
    const ids = [...admins, ...mods].map((u) => u.id);
    await fn(ids);
  } catch (err) {
    console.error("[notifyStaff] fan-out failed", err);
  }
}

export function forumRoutes(repos: Repositories): Router {
  const router = Router();

  router.get("/countries", async (_req, res) => {
    res.json(await repos.forum.getCountries());
  });

  router.post("/countries", authMiddleware, requireRole("admin"), async (req, res) => {
    res.json(await repos.forum.createCountry(req.body));
  });

  router.get("/countries/:countryId/categories", async (req, res) => {
    res.json(await repos.forum.getCategories(req.params.countryId));
  });

  router.post("/categories", authMiddleware, requireRole("admin", "moderator"), async (req, res) => {
    res.json(await repos.forum.createCategory(req.body));
  });

  router.get("/categories/:categoryId/topics", optionalAuthMiddleware, async (req: AuthRequest, res) => {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
    const filterParam = typeof req.query.filter === "string" && req.query.filter === "popular" ? "popular" : undefined;
    res.json(await repos.forum.getTopics(req.params.categoryId as string, { onlyApproved: true, page, limit, filter: filterParam, viewerId: req.userId }));
  });

  // FRM-TPC-003: Tek konu detayını içerikle birlikte döndür (mobile detay ekranı için)
  router.get("/topics/:id", optionalAuthMiddleware, async (req: AuthRequest, res) => {
    const topic = await repos.forum.getTopicById(req.params.id as string, req.userId);
    if (!topic || topic.deletedAt) return res.status(404).json({ error: "Konu bulunamadı." });

    // Favori durumu — yalnız tokenlı kullanıcı için
    let favorited = false;
    if (req.userId) {
      favorited = await repos.forum.isTopicFavorited(topic.id, req.userId).catch(() => false);
    }
    res.json({ ...topic, favorited });
  });

  // ── FRM-TPC-002: Konu açma ───────────────────────────────────────────────────
  router.post("/topics", authMiddleware, async (req: AuthRequest, res) => {
    const { categoryId, title, content } = req.body;
    if (!categoryId || !title) {
      return res.status(400).json({ error: "categoryId ve title zorunlu" });
    }

    const isStaff = req.userRole === "admin" || req.userRole === "moderator";

    if (!isStaff) {
      const user = await repos.users.findById(req.userId!);
      if (!user) return res.status(401).json({ error: "Kullanıcı bulunamadı." });

      const TOPIC_COST = config.forum.createTopicCost;
      const hasPremium = user.isPremium && (!user.premiumUntil || new Date(user.premiumUntil) > new Date());

      if (!hasPremium) {
        const deducted = await repos.users.deductCredits(req.userId!, TOPIC_COST);
        if (!deducted) {
          return res.status(402).json({
            error: `Yeni konu açmak için ${TOPIC_COST} kredi veya premium üyelik gerekli.`,
            code: "INSUFFICIENT_CREDITS",
            required: TOPIC_COST,
            balance: user.credits,
          });
        }
      }
    }

    const status = isStaff ? "approved" : "pending";
    let topic;
    try {
      topic = await repos.forum.createTopic({
        categoryId,
        title,
        content,
        authorId: req.userId!,
        status,
        isPinned: false,
      });
    } catch (createErr: any) {
      if (!isStaff) {
        const user2 = await repos.users.findById(req.userId!);
        const hasPremium2 = user2?.isPremium && (!user2.premiumUntil || new Date(user2.premiumUntil) > new Date());
        if (!hasPremium2) {
          await repos.users.addCredits(req.userId!, config.forum.createTopicCost);
        }
      }
      return res.status(500).json({ error: createErr.message || "Konu oluşturulamadı." });
    }

    if (status === "approved") {
      repos.notifications
        .notifyCountrySubscribers(categoryId, topic.id, title, req.userId!)
        .catch((err) => console.error("[forum.create] notifyCountrySubscribers failed", err));
    } else {
      try {
        broadcastPendingTopic({ type: "new_pending", topic });
      } catch (err) {
        console.error("[forum.create] broadcastPendingTopic failed", err);
      }
      repos.notifications
        .create({
          userId: req.userId!,
          type: "system",
          title: "Konunuz alındı",
          message: `"${title}" başlıklı konunuz moderatör incelemesine alındı. Onaylandığında size haber vereceğiz.`,
          targetType: "forum_topic",
          targetId: topic.id,
        })
        .catch((err) => console.error("[forum.create] author notification failed", err));

      const author = await repos.users.findById(req.userId!).catch(() => null);
      const authorName = author?.displayName ?? "Bir kullanıcı";
      notifyStaff(repos, (staffIds) =>
        repos.notifications.notifyStaffOfPendingTopic(topic.id, title, authorName, staffIds)
      );
    }

    res.json(topic);
  });

  // ── FRM-TPC-005: Konu düzenleme ──────────────────────────────────────────────
  router.patch("/topics/:id", authMiddleware, async (req: AuthRequest, res) => {
    const topicId = req.params.id as string;
    const { title, content } = req.body;

    if (title === undefined && content === undefined) {
      return res.status(400).json({ error: "title veya content gerekli." });
    }
    if (title !== undefined && (typeof title !== "string" || title.trim().length < 10)) {
      return res.status(400).json({ error: "Başlık en az 10 karakter olmalı." });
    }
    if (content !== undefined && typeof content !== "string") {
      return res.status(400).json({ error: "content metin olmalı." });
    }

    const topic = await repos.forum.getTopicById(topicId);
    if (!topic || topic.deletedAt) return res.status(404).json({ error: "Konu bulunamadı." });

    const isOwner = topic.authorId === req.userId;
    const isStaff = req.userRole === "admin" || req.userRole === "moderator";
    if (!isOwner && !isStaff) return res.status(403).json({ error: "Bu konuyu düzenleme yetkiniz yok." });

    if (isOwner && !isStaff) {
      const age = Date.now() - new Date(topic.createdAt).getTime();
      if (age > TOPIC_EDIT_WINDOW_MS) {
        return res.status(403).json({ error: "Konu açıldıktan 24 saat sonra düzenlenemez." });
      }
    }

    const updates: { title?: string; content?: string } = {};
    if (title !== undefined) updates.title = title.trim();
    if (content !== undefined) updates.content = content;
    await repos.forum.updateTopic(topicId, updates);

    const updated = await repos.forum.getTopicById(topicId);
    res.json(updated);
  });

  // ── FRM-TPC-006: Konu silme talebi (admin onayı zorunlu) ─────────────────────
  router.post("/topics/:id/deletion-request", authMiddleware, async (req: AuthRequest, res) => {
    const topicId = req.params.id as string;
    const { reason } = req.body;

    if (typeof reason !== "string" || reason.trim().length < 5) {
      return res.status(400).json({ error: "Silme sebebi en az 5 karakter olmalı." });
    }

    const topic = await repos.forum.getTopicById(topicId);
    if (!topic || topic.deletedAt) return res.status(404).json({ error: "Konu bulunamadı." });

    const isOwner = topic.authorId === req.userId;
    const isStaff = req.userRole === "admin" || req.userRole === "moderator";

    // Staff can delete directly (no request needed) — handled by separate admin endpoint
    if (!isOwner && !isStaff) return res.status(403).json({ error: "Sadece konu sahibi silme talebi açabilir." });

    // Block duplicate pending requests
    const existing = await repos.forum.getDeletionRequestByTopic(topicId);
    if (existing) {
      return res.status(409).json({ error: "Bu konu için zaten bekleyen bir silme talebi var.", request: existing });
    }

    const request = await repos.forum.createDeletionRequest({
      topicId,
      requesterId: req.userId!,
      reason: reason.trim(),
    });

    // Notify staff
    const requester = await repos.users.findById(req.userId!).catch(() => null);
    const requesterName = requester?.displayName ?? "Bir kullanıcı";
    notifyStaff(repos, (staffIds) =>
      repos.notifications.notifyStaffOfDeletionRequest(topicId, topic.title, requesterName, staffIds)
    );

    res.status(201).json(request);
  });

  router.get("/topics/:id/deletion-request", authMiddleware, async (req: AuthRequest, res) => {
    const topicId = req.params.id as string;
    const request = await repos.forum.getDeletionRequestByTopic(topicId);
    res.json(request);
  });

  // ── FRM-TPC-008: Favoriler ───────────────────────────────────────────────────
  router.post("/topics/:id/favorite", authMiddleware, async (req: AuthRequest, res) => {
    const topicId = req.params.id as string;
    const topic = await repos.forum.getTopicById(topicId);
    if (!topic || topic.deletedAt) return res.status(404).json({ error: "Konu bulunamadı." });

    const result = await repos.forum.toggleFavoriteTopic(topicId, req.userId!);
    res.json(result);
  });

  router.get("/topics/:id/favorite", authMiddleware, async (req: AuthRequest, res) => {
    const topicId = req.params.id as string;
    const favorited = await repos.forum.isTopicFavorited(topicId, req.userId!);
    res.json({ favorited });
  });

  router.get("/search", async (req, res) => {
    if (typeof req.query.q !== "string") {
      return res.status(400).json({ error: "q parametresi string olmalı" });
    }
    const q = req.query.q.trim();
    if (q.length < 2) {
      return res.status(400).json({ error: "q parametresi en az 2 karakter olmalı" });
    }
    if (q.startsWith("$") || q.startsWith("{")) {
      return res.status(400).json({ error: "Geçersiz arama terimi" });
    }
    const countryId = typeof req.query.countryId === "string" ? req.query.countryId : undefined;
    res.json(await repos.forum.searchTopics(q, countryId));
  });

  router.post("/topics/:id/upvote", authMiddleware, async (req: AuthRequest, res) => {
    const topicId = req.params.id as string;
    const result = await repos.forum.upvoteTopic(topicId, req.userId!);
    res.json(result);
  });

  // ── NTF-EVT-002 / NTF-EVT-003: Admin onay/red ───────────────────────────────
  router.patch("/topics/:id/status", authMiddleware, requireRole("admin", "moderator"), async (req: AuthRequest, res) => {
    const topicId = req.params.id as string;
    const { status, reason } = req.body;

    if (status !== "approved" && status !== "rejected") {
      return res.status(400).json({ error: "status 'approved' veya 'rejected' olmalı." });
    }
    if (status === "rejected" && (typeof reason !== "string" || reason.trim().length < 5)) {
      return res.status(400).json({ error: "Reddetme sebebi en az 5 karakter olmalı." });
    }

    const topic = await repos.forum.getTopicById(topicId);
    if (!topic) return res.status(404).json({ error: "Konu bulunamadı." });

    await repos.forum.updateTopicStatus(topicId, status, status === "rejected" ? reason.trim() : undefined);

    const type = status === "approved" ? "topic_approved" : "topic_rejected";
    const notifTitle = status === "approved" ? "İlanınız onaylandı 🎉" : "İlanınız reddedildi";
    const notifMsg =
      status === "approved"
        ? `"${topic.title}" başlıklı ilanınız onaylanmıştır! Artık herkes görebilir.`
        : `"${topic.title}" başlıklı ilanınız reddedilmiştir. Sebep: ${reason}`;

    repos.notifications
      .create({
        userId: topic.authorId,
        type,
        title: notifTitle,
        message: notifMsg,
        targetType: "forum_topic",
        targetId: topicId,
      })
      .catch(() => {});

    if (status === "approved") {
      repos.notifications.notifyCountrySubscribers(topic.categoryId, topicId, topic.title, topic.authorId).catch(() => {});
    }

    res.json({ ok: true });
  });

  // ── FRM-CMT-001: Yorum listesi (likes + hasLiked dahil) ──────────────────────
  router.get("/topics/:topicId/comments", optionalAuthMiddleware, async (req: AuthRequest, res) => {
    // Anonim ziyaretçi → hasLiked her zaman false; tokenlı kullanıcı → kendi beğenisi görünür
    res.json(await repos.forum.getComments(req.params.topicId as string, req.userId));
  });

  // ── FRM-CMT-002 + FRM-CMT-006: Yorum oluşturma (nested parent destekli) ─────
  router.post("/topics/:topicId/comments", authMiddleware, async (req: AuthRequest, res) => {
    const topicId = req.params.topicId as string;
    const { content, parentCommentId } = req.body;

    if (typeof content !== "string" || !content.trim()) {
      return res.status(400).json({ error: "Yorum içeriği boş olamaz." });
    }

    // FRM-CMT-006: parent doğrulama
    if (parentCommentId) {
      const parent = await repos.forum.getCommentById(parentCommentId);
      if (!parent || parent.topicId !== topicId) {
        return res.status(400).json({ error: "Yanıtlanan yorum bulunamadı." });
      }
      if (parent.deletedAt) {
        return res.status(400).json({ error: "Silinmiş yoruma yanıt verilemez." });
      }
    }

    const comment = await repos.forum.createComment({
      topicId,
      authorId: req.userId!,
      content: content.trim(),
      parentCommentId: parentCommentId ?? null,
    });

    // NTF-EVT-004: Topic ve parent yazarına bildirim
    const topic = await repos.forum.getTopicById(topicId).catch(() => null);
    repos.notifications.notifyTopicSubscribers(topicId, topic?.title ?? "", comment.authorDisplayName, req.userId!).catch(() => {});

    // Parent yorum yazarına özel "reply" bildirimi
    if (parentCommentId) {
      const parent = await repos.forum.getCommentById(parentCommentId);
      if (parent && parent.authorId !== req.userId) {
        repos.notifications
          .create({
            userId: parent.authorId,
            type: "comment_reply",
            title: "Yorumunuza yanıt geldi",
            message: `${comment.authorDisplayName}: ${content.trim().slice(0, 80)}`,
            targetType: "forum_topic",
            targetId: topicId,
          })
          .catch(() => {});
      }
    }

    res.json(comment);
  });

  // ── FRM-CMT-003: Yorum düzenleme ─────────────────────────────────────────────
  router.patch("/topics/:topicId/comments/:id", authMiddleware, async (req: AuthRequest, res) => {
    const commentId = req.params.id as string;
    const { content } = req.body;

    if (typeof content !== "string" || !content.trim()) {
      return res.status(400).json({ error: "Yorum içeriği boş olamaz." });
    }

    const comment = await repos.forum.getCommentById(commentId);
    if (!comment || comment.deletedAt) return res.status(404).json({ error: "Yorum bulunamadı." });

    const isOwner = comment.authorId === req.userId;
    const isStaff = req.userRole === "admin" || req.userRole === "moderator";

    if (!isOwner && !isStaff) return res.status(403).json({ error: "Bu yorumu düzenleme yetkiniz yok." });

    if (isOwner && !isStaff) {
      const age = Date.now() - new Date(comment.createdAt).getTime();
      if (age > COMMENT_EDIT_WINDOW_MS) {
        return res.status(403).json({ error: "Yorum yazıldıktan 15 dakika sonra düzenlenemez." });
      }
    }

    await repos.forum.updateComment(commentId, content.trim());
    const updated = await repos.forum.getCommentById(commentId);
    res.json(updated);
  });

  // ── FRM-CMT-004: Yorum silme (soft delete) ──────────────────────────────────
  router.delete("/topics/:topicId/comments/:id", authMiddleware, async (req: AuthRequest, res) => {
    const commentId = req.params.id as string;

    const comment = await repos.forum.getCommentById(commentId);
    if (!comment || comment.deletedAt) return res.status(404).json({ error: "Yorum bulunamadı." });

    const isOwner = comment.authorId === req.userId;
    const isStaff = req.userRole === "admin" || req.userRole === "moderator";

    if (!isOwner && !isStaff) return res.status(403).json({ error: "Bu yorumu silme yetkiniz yok." });

    await repos.forum.softDeleteComment(commentId, req.userId!);
    res.json({ ok: true });
  });

  // ── FRM-CMT-005: Yorum beğenme (toggle) ─────────────────────────────────────
  router.post("/topics/:topicId/comments/:id/like", authMiddleware, async (req: AuthRequest, res) => {
    const commentId = req.params.id as string;
    const comment = await repos.forum.getCommentById(commentId);
    if (!comment || comment.deletedAt) return res.status(404).json({ error: "Yorum bulunamadı." });

    const result = await repos.forum.toggleCommentLike(commentId, req.userId!);

    // Yorum sahibine bildirim (yalnız yeni beğeni geldiğinde, kendisi değilse)
    if (result.hasLiked && comment.authorId !== req.userId) {
      const liker = await repos.users.findById(req.userId!).catch(() => null);
      repos.notifications
        .create({
          userId: comment.authorId,
          type: "comment_like",
          title: "Yorumunuz beğenildi",
          message: `${liker?.displayName ?? "Bir kullanıcı"} yorumunuzu beğendi.`,
          targetType: "forum_topic",
          targetId: comment.topicId,
        })
        .catch(() => {});
    }

    res.json(result);
  });

  // ── Topic subscribe / unsubscribe ────────────────────────────────────────────

  router.post("/topics/:id/subscribe", authMiddleware, async (req: AuthRequest, res) => {
    try {
      await repos.notifications.setTopicSubscription(req.userId!, req.params.id as string, true);
      res.json({ ok: true, subscribed: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  router.delete("/topics/:id/subscribe", authMiddleware, async (req: AuthRequest, res) => {
    try {
      await repos.notifications.setTopicSubscription(req.userId!, req.params.id as string, false);
      res.json({ ok: true, subscribed: false });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  router.get("/topics/:id/subscribe", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const subscribed = await repos.notifications.isTopicSubscribed(req.userId!, req.params.id as string);
      res.json({ subscribed });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  return router;
}
