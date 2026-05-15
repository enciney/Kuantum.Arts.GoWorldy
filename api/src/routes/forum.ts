import { Router } from "express";
import { Repositories } from "../repositories";
import { authMiddleware, requireRole, AuthRequest } from "../middleware/auth";
import { config } from "../config";
import { broadcastPendingTopic } from "./admin";

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

  router.get("/categories/:categoryId/topics", async (req, res) => {
    res.json(await repos.forum.getTopics(req.params.categoryId));
  });

  router.post("/topics", authMiddleware, async (req: AuthRequest, res) => {
    const { categoryId, title } = req.body;
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
    const topic = await repos.forum.createTopic({
      categoryId,
      title,
      authorId: req.userId!,
      status,
      isPinned: false,
    });

    if (status === "approved") {
      // Staff created → notify country subscribers immediately
      repos.notifications.notifyCountrySubscribers(categoryId, topic.id, title, req.userId!).catch(() => {});
    } else {
      // Normal user → broadcast to admin SSE + notify author that review started
      broadcastPendingTopic({ type: "new_pending", topic });
      repos.notifications.create({
        userId: req.userId!,
        type: "system",
        title: "Konunuz alındı",
        message: `"${title}" başlıklı konunuz moderatör incelemesine alındı. Onaylandığında size haber vereceğiz.`,
        targetType: "forum_topic",
        targetId: topic.id,
      }).catch(() => {});
    }

    res.json(topic);
  });

  router.get("/search", async (req, res) => {
    const q = ((req.query.q as string) ?? "").trim();
    if (q.length < 2) {
      return res.status(400).json({ error: "q parametresi en az 2 karakter olmalı" });
    }
    const countryId = (req.query.countryId as string) || undefined;
    res.json(await repos.forum.searchTopics(q, countryId));
  });

  router.post("/topics/:id/upvote", authMiddleware, async (req: AuthRequest, res) => {
    const topicId = req.params.id as string;
    const result = await repos.forum.upvoteTopic(topicId, req.userId!);
    res.json(result);
  });

  router.patch("/topics/:id/status", authMiddleware, requireRole("admin", "moderator"), async (req: AuthRequest, res) => {
    const topicId = req.params.id as string;
    const { status, reason } = req.body;

    // Fetch topic before updating for notification data
    const topic = await repos.forum.getTopicById(topicId);

    await repos.forum.updateTopicStatus(topicId, status, reason);

    // Notify topic author of approval/rejection
    if (topic) {
      const type = status === "approved" ? "topic_approved" : "topic_rejected";
      const notifTitle = status === "approved" ? "İlanınız onaylandı 🎉" : "İlanınız reddedildi";
      const notifMsg = status === "approved"
        ? `"${topic.title}" başlıklı ilanınız onaylanmıştır! Artık herkes görebilir.`
        : `"${topic.title}" başlıklı ilanınız reddedilmiştir.${reason ? " Sebep: " + reason : ""} Detaylar için bildirimlerinizi kontrol edin.`;

      repos.notifications.create({
        userId: topic.authorId,
        type,
        title: notifTitle,
        message: notifMsg,
        targetType: "forum_topic",
        targetId: topicId,
      }).catch(() => {});

      // If approved, also notify country subscribers
      if (status === "approved") {
        repos.notifications.notifyCountrySubscribers(topic.categoryId, topicId, topic.title, topic.authorId).catch(() => {});
      }
    }

    res.json({ ok: true });
  });

  router.get("/topics/:topicId/comments", async (req, res) => {
    res.json(await repos.forum.getComments(req.params.topicId));
  });

  router.post("/topics/:topicId/comments", authMiddleware, async (req: AuthRequest, res) => {
    const topicId = req.params.topicId as string;
    const comment = await repos.forum.createComment({
      topicId,
      authorId: req.userId!,
      content: req.body.content,
    });

    // Notify topic subscribers + topic author (fire-and-forget)
    const topic = await repos.forum.getTopicById(topicId).catch(() => null);
    repos.notifications.notifyTopicSubscribers(
      topicId,
      topic?.title ?? "",
      comment.authorDisplayName,
      req.userId!
    ).catch(() => {});

    res.json(comment);
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
