import { Router, Response } from "express";
import jwt from "jsonwebtoken";
import { Repositories } from "../repositories";
import { authMiddleware, requireRole, AuthRequest } from "../middleware/auth";
import { config } from "../config";

// In-memory SSE client list for real-time topic approval page
const sseClients: Set<Response> = new Set();

export function broadcastPendingTopic(topic: unknown): void {
  const data = `data: ${JSON.stringify(topic)}\n\n`;
  for (const client of sseClients) {
    try { client.write(data); } catch (_) { sseClients.delete(client); }
  }
}

export function adminRoutes(repos: Repositories): Router {
  const router = Router();

  router.get("/dashboard", authMiddleware, requireRole("admin"), async (_req, res) => {
    try {
      const totalUsers = await repos.users.count();
      const totalTopics = await repos.forum.countTopics();
      const totalComments = await repos.forum.countComments();
      const totalCountries = await repos.forum.countCountries();

      const userTypes = await repos.users.getUserTypeStats();
      const recentUsers = await repos.users.getRecent(10);

      res.json({
        stats: {
          totalUsers,
          totalTopics,
          totalComments,
          totalCountries,
        },
        userTypes,
        recentUsers,
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  router.get("/users", authMiddleware, requireRole("admin", "moderator"), async (req, res) => {
    try {
      const { search, role, userType, limit = 50, offset = 0 } = req.query;
      const users = await repos.users.search({
        search: search as string,
        role: role as string,
        userType: userType as string,
        limit: Number(limit),
        offset: Number(offset),
      });
      res.json(users);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  router.get("/users/:id", authMiddleware, requireRole("admin", "moderator"), async (req, res) => {
    try {
      const user = await repos.users.findById(req.params.id as string);
      if (!user) return res.status(404).json({ error: "User not found" });
      res.json(user);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  router.patch("/users/:id/role", authMiddleware, requireRole("admin"), async (req, res) => {
    try {
      const { role } = req.body;
      if (![config.roles.admin, config.roles.moderator, config.roles.user].includes(role)) {
        return res.status(400).json({ error: "Invalid role" });
      }
      await repos.users.updateRole(req.params.id as string, role as "admin" | "moderator" | "user");
      res.json({ ok: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  router.patch("/topics/:id/pin", authMiddleware, requireRole("admin", "moderator"), async (req, res) => {
    try {
      const { isPinned } = req.body;
      if (typeof isPinned !== "boolean") {
        return res.status(400).json({ error: "isPinned (boolean) zorunlu" });
      }
      await repos.forum.pinTopic(req.params.id as string, isPinned);
      res.json({ ok: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  router.get("/forum/pending", authMiddleware, requireRole("admin", "moderator"), async (req, res) => {
    try {
      const { limit = 50, offset = 0 } = req.query;
      const topics = await repos.forum.getPendingTopics(Number(limit), Number(offset));
      res.json(topics);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  router.get("/forum/stats", authMiddleware, requireRole("admin", "moderator"), async (req, res) => {
    try {
      const { countryId } = req.query;
      const stats = await repos.forum.getStats(countryId as string);
      res.json(stats);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  router.get("/guide/stats", authMiddleware, requireRole("admin"), async (_req, res) => {
    try {
      const stats = await repos.guide.getStats();
      res.json(stats);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Sadece uygulamanın ayağa kalkması için gereken kritik bilgiler (salt okunur)
  // Forum/premium fiyatları ve özellik bayrakları artık admin settings (DB) tarafında
  router.get("/config", authMiddleware, requireRole("admin"), async (_req, res) => {
    res.json({
      app: config.app,
      server: {
        port: config.port,
        nodeEnv: process.env.NODE_ENV || "development",
        jwtExpiry: config.jwtExpiry,
      },
      admin: {
        email: config.admin.email,
      },
      integrations: {
        firebaseConfigured: !!(config.firebase.projectId && config.firebase.clientEmail),
        stripeConfigured: !!config.stripe.secretKey,
        sendgridConfigured: !!config.sendgrid.apiKey,
        googleAuthConfigured: !!config.google.webClientId,
      },
    });
  });

  // ── Sistem Ayarları (DB'de saklanır, env fallback) ──────────────────────────
  router.get("/settings", authMiddleware, requireRole("admin"), async (_req, res) => {
    try {
      const { systemSettings } = await (await import("../repositories/mongodb/db")).getCollections();
      const doc = await systemSettings.findOne({ _id: "singleton" });
      res.json({
        commentEditWindowMinutes: doc?.commentEditWindowMinutes ?? config.forum.commentEditWindowMinutes,
        commentDeleteWindowMinutes: doc?.commentDeleteWindowMinutes ?? config.forum.commentDeleteWindowMinutes,
        guideEnableNotifications: doc?.guideEnableNotifications ?? config.guide.enableNotifications,
        guideEnableRecommendations: doc?.guideEnableRecommendations ?? config.guide.enableRecommendations,
        notificationsEnableEmail: doc?.notificationsEnableEmail ?? config.notifications.enableEmail,
        notificationsEnableInApp: doc?.notificationsEnableInApp ?? config.notifications.enableInApp,
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  router.patch("/settings", authMiddleware, requireRole("admin"), async (req: AuthRequest, res) => {
    try {
      const allowed = [
        "commentEditWindowMinutes", "commentDeleteWindowMinutes",
        "guideEnableNotifications", "guideEnableRecommendations",
        "notificationsEnableEmail", "notificationsEnableInApp",
      ];
      const update: Record<string, unknown> = {};
      for (const key of allowed) {
        if (req.body[key] !== undefined) update[key] = req.body[key];
      }
      if (Object.keys(update).length === 0) {
        return res.status(400).json({ error: "Güncellenecek alan bulunamadı." });
      }
      const { systemSettings } = await (await import("../repositories/mongodb/db")).getCollections();
      await systemSettings.updateOne(
        { _id: "singleton" },
        { $set: update },
        { upsert: true }
      );
      // config nesnesini de güncelle (process restart gerekmeden etkinleşsin)
      if (update.commentEditWindowMinutes !== undefined) config.forum.commentEditWindowMinutes = update.commentEditWindowMinutes as number;
      if (update.commentDeleteWindowMinutes !== undefined) config.forum.commentDeleteWindowMinutes = update.commentDeleteWindowMinutes as number;
      if (update.guideEnableNotifications !== undefined) config.guide.enableNotifications = update.guideEnableNotifications as boolean;
      if (update.guideEnableRecommendations !== undefined) config.guide.enableRecommendations = update.guideEnableRecommendations as boolean;
      if (update.notificationsEnableEmail !== undefined) config.notifications.enableEmail = update.notificationsEnableEmail as boolean;
      if (update.notificationsEnableInApp !== undefined) config.notifications.enableInApp = update.notificationsEnableInApp as boolean;
      res.json({ ok: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // ── SSE: Real-time pending topic stream ──────────────────────────────────────
  // EventSource cannot send custom headers; token comes as ?token= query param.
  router.get("/topics/stream", (req: AuthRequest, res) => {
    const qToken = req.query.token as string | undefined;
    const headerToken = req.headers.authorization?.replace("Bearer ", "");
    const rawToken = headerToken ?? qToken;

    if (!rawToken) return res.status(401).json({ error: "Token required" });

    let decoded: { id: string; role: string };
    try {
      decoded = jwt.verify(rawToken, config.jwtSecret) as { id: string; role: string };
    } catch {
      return res.status(401).json({ error: "Invalid token" });
    }

    if (decoded.role !== "admin" && decoded.role !== "moderator") {
      return res.status(403).json({ error: "Access denied" });
    }
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");
    res.flushHeaders();

    // Send current pending count as initial event
    repos.forum.getPendingTopics(50, 0)
      .then((topics) => {
        res.write(`data: ${JSON.stringify({ type: "init", topics })}\n\n`);
      })
      .catch(() => {});

    sseClients.add(res);

    // Heartbeat every 25s to keep connection alive through proxies
    const heartbeat = setInterval(() => {
      try { res.write(": heartbeat\n\n"); } catch (_) { /* ignore */ }
    }, 25000);

    req.on("close", () => {
      clearInterval(heartbeat);
      sseClients.delete(res);
    });
  });

  // ── Premium Plans ────────────────────────────────────────────────────────────
  router.get("/premium/plans", authMiddleware, requireRole("admin"), async (_req, res) => {
    try {
      const plans = await repos.premium.getPlans();
      res.json(plans);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  router.post("/premium/plans", authMiddleware, requireRole("admin"), async (req, res) => {
    try {
      const { name, description, price, durationDays, features, featureKeys, isSubscription, subscriptionDiscountPercent, isActive } = req.body;
      if (!name || price == null || !durationDays) {
        return res.status(400).json({ error: "name, price, durationDays zorunlu" });
      }
      const discount = Number(subscriptionDiscountPercent ?? 0);
      if (discount < 0 || discount > 100) {
        return res.status(400).json({ error: "subscriptionDiscountPercent 0-100 arası olmalı" });
      }
      const plan = await repos.premium.createPlan({
        name,
        description: description ?? "",
        price: Number(price),
        durationDays: Number(durationDays),
        features: features ?? [],
        featureKeys: featureKeys ?? [],
        isSubscription: isSubscription === true,
        subscriptionDiscountPercent: discount,
        isActive: isActive !== false,
      });
      res.status(201).json(plan);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  router.patch("/premium/plans/:id", authMiddleware, requireRole("admin"), async (req, res) => {
    try {
      const { name, description, price, durationDays, features, featureKeys, isSubscription, subscriptionDiscountPercent, isActive } = req.body;
      const update: Record<string, unknown> = {};
      if (name !== undefined) update.name = name;
      if (description !== undefined) update.description = description;
      if (price !== undefined) update.price = Number(price);
      if (durationDays !== undefined) update.durationDays = Number(durationDays);
      if (features !== undefined) update.features = features;
      if (featureKeys !== undefined) update.featureKeys = featureKeys;
      if (isSubscription !== undefined) update.isSubscription = isSubscription === true;
      if (subscriptionDiscountPercent !== undefined) {
        const d = Number(subscriptionDiscountPercent);
        if (d < 0 || d > 100) return res.status(400).json({ error: "subscriptionDiscountPercent 0-100 arası olmalı" });
        update.subscriptionDiscountPercent = d;
      }
      if (isActive !== undefined) update.isActive = isActive;
      await repos.premium.updatePlan(req.params.id as string, update);
      res.json({ ok: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  router.delete("/premium/plans/:id", authMiddleware, requireRole("admin"), async (req, res) => {
    try {
      await repos.premium.deletePlan(req.params.id as string);
      res.json({ ok: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // ── PRM-FST-001: Premium Feature Catalog ────────────────────────────────────
  router.get("/premium/features", authMiddleware, requireRole("admin"), async (_req, res) => {
    try {
      const features = await repos.premiumFeatures.getAll();
      res.json(features);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  router.post("/premium/features", authMiddleware, requireRole("admin"), async (req, res) => {
    try {
      const { key, name, description, mainFeatureId, durationDays, quota, isActive } = req.body;
      if (!key || !name) {
        return res.status(400).json({ error: "key ve name zorunlu" });
      }
      if (!/^[a-z0-9_]+$/.test(key)) {
        return res.status(400).json({ error: "key sadece küçük harf, rakam ve _ içerebilir" });
      }
      // mainFeatureId varsa geçerli kategori olduğunu doğrula
      if (mainFeatureId) {
        const mf = await repos.premiumMainFeatures.getById(mainFeatureId);
        if (!mf) return res.status(400).json({ error: "Geçersiz mainFeatureId" });
      }
      const feature = await repos.premiumFeatures.create({
        key,
        name,
        description: description ?? "",
        mainFeatureId: mainFeatureId ?? null,
        durationDays: durationDays == null || durationDays === "" ? null : Number(durationDays),
        quota: quota == null || quota === "" ? null : Number(quota),
        isActive: isActive !== false,
      });
      res.status(201).json(feature);
    } catch (e: any) {
      if (e.code === 11000) {
        return res.status(409).json({ error: "Bu key zaten kullanılıyor." });
      }
      res.status(500).json({ error: e.message });
    }
  });

  router.patch("/premium/features/:id", authMiddleware, requireRole("admin"), async (req, res) => {
    try {
      const { key, name, description, mainFeatureId, durationDays, quota, isActive } = req.body;
      const update: Record<string, unknown> = {};
      if (key !== undefined) {
        if (!/^[a-z0-9_]+$/.test(key)) {
          return res.status(400).json({ error: "key sadece küçük harf, rakam ve _ içerebilir" });
        }
        update.key = key;
      }
      if (name !== undefined) update.name = name;
      if (description !== undefined) update.description = description;
      if (mainFeatureId !== undefined) {
        if (mainFeatureId) {
          const mf = await repos.premiumMainFeatures.getById(mainFeatureId);
          if (!mf) return res.status(400).json({ error: "Geçersiz mainFeatureId" });
        }
        update.mainFeatureId = mainFeatureId || null;
      }
      if (durationDays !== undefined) update.durationDays = durationDays == null || durationDays === "" ? null : Number(durationDays);
      if (quota !== undefined) update.quota = quota == null || quota === "" ? null : Number(quota);
      if (isActive !== undefined) update.isActive = isActive;
      await repos.premiumFeatures.update(req.params.id as string, update);
      res.json({ ok: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  router.delete("/premium/features/:id", authMiddleware, requireRole("admin"), async (req, res) => {
    try {
      await repos.premiumFeatures.delete(req.params.id as string);
      res.json({ ok: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // ── PRM-FST-002: Premium Main Feature Catalog (3 ana paket kategorisi) ─────
  router.get("/premium/main-features", authMiddleware, requireRole("admin"), async (_req, res) => {
    try {
      const items = await repos.premiumMainFeatures.getAll();
      res.json(items);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  router.post("/premium/main-features", authMiddleware, requireRole("admin"), async (req, res) => {
    try {
      const { key, name, description, isActive } = req.body;
      if (!key || !name) {
        return res.status(400).json({ error: "key ve name zorunlu" });
      }
      if (!/^[a-z0-9_]+$/.test(key)) {
        return res.status(400).json({ error: "key sadece küçük harf, rakam ve _ içerebilir" });
      }
      const item = await repos.premiumMainFeatures.create({
        key,
        name,
        description: description ?? "",
        isActive: isActive !== false,
      });
      res.status(201).json(item);
    } catch (e: any) {
      if (e.code === 11000) {
        return res.status(409).json({ error: "Bu key zaten kullanılıyor." });
      }
      res.status(500).json({ error: e.message });
    }
  });

  router.patch("/premium/main-features/:id", authMiddleware, requireRole("admin"), async (req, res) => {
    try {
      const { key, name, description, isActive } = req.body;
      const update: Record<string, unknown> = {};
      if (key !== undefined) {
        if (!/^[a-z0-9_]+$/.test(key)) {
          return res.status(400).json({ error: "key sadece küçük harf, rakam ve _ içerebilir" });
        }
        update.key = key;
      }
      if (name !== undefined) update.name = name;
      if (description !== undefined) update.description = description;
      if (isActive !== undefined) update.isActive = isActive;
      await repos.premiumMainFeatures.update(req.params.id as string, update);
      res.json({ ok: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  router.delete("/premium/main-features/:id", authMiddleware, requireRole("admin"), async (req, res) => {
    try {
      await repos.premiumMainFeatures.delete(req.params.id as string);
      res.json({ ok: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // ── Premium Users ─────────────────────────────────────────────────────────────
  router.get("/premium/users", authMiddleware, requireRole("admin", "moderator"), async (req, res) => {
    try {
      const { limit = 100, offset = 0 } = req.query;
      const users = await repos.premium.getPremiumUsers(Number(limit), Number(offset));
      res.json(users);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  router.post("/premium/users/:id/grant", authMiddleware, requireRole("admin"), async (req, res) => {
    try {
      const { planId, durationDays } = req.body;
      let days = Number(durationDays);
      if (!days && planId) {
        const plan = await repos.premium.getPlanById(planId as string);
        days = plan?.durationDays ?? 30;
      }
      if (!days) return res.status(400).json({ error: "planId veya durationDays zorunlu" });
      const until = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
      await repos.users.update(req.params.id as string, { isPremium: true, premiumUntil: until });
      res.json({ ok: true, premiumUntil: until });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  router.delete("/premium/users/:id/grant", authMiddleware, requireRole("admin"), async (req, res) => {
    try {
      await repos.users.update(req.params.id as string, { isPremium: false, premiumUntil: undefined });
      res.json({ ok: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // ── FRM-TPC-006: Konu silme talebi kuyruğu ─────────────────────────────────
  router.get("/forum/deletion-requests", authMiddleware, requireRole("admin", "moderator"), async (req, res) => {
    try {
      const limit = Math.min(Number(req.query.limit) || 50, 100);
      const offset = Number(req.query.offset) || 0;
      const requests = await repos.forum.getPendingDeletionRequests(limit, offset);
      res.json(requests);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  router.patch("/forum/deletion-requests/:id", authMiddleware, requireRole("admin", "moderator"), async (req: AuthRequest, res) => {
    try {
      const { status, rejectionReason } = req.body;
      if (status !== "approved" && status !== "rejected") {
        return res.status(400).json({ error: "status 'approved' veya 'rejected' olmalı." });
      }
      if (status === "rejected" && (typeof rejectionReason !== "string" || rejectionReason.trim().length < 5)) {
        return res.status(400).json({ error: "Reddetme sebebi en az 5 karakter olmalı." });
      }

      const resolved = await repos.forum.resolveDeletionRequest(
        req.params.id as string,
        status,
        req.userId!,
        status === "rejected" ? rejectionReason.trim() : undefined
      );
      if (!resolved) return res.status(404).json({ error: "Talep bulunamadı." });

      const topic = await repos.forum.getTopicById(resolved.topicId);

      if (status === "approved" && topic) {
        await repos.forum.softDeleteTopic(resolved.topicId, req.userId!);
        repos.notifications.create({
          userId: resolved.requesterId,
          type: "deletion_approved",
          title: "Konunuz silindi",
          message: `"${topic.title}" başlıklı konu silme talebiniz onaylandı.`,
          targetType: "forum_topic",
          targetId: resolved.topicId,
        }).catch(() => {});
      } else if (status === "rejected" && topic) {
        repos.notifications.create({
          userId: resolved.requesterId,
          type: "deletion_rejected",
          title: "Silme talebiniz reddedildi",
          message: `"${topic.title}" konusu için silme talebiniz reddedildi. Sebep: ${rejectionReason}`,
          targetType: "forum_topic",
          targetId: resolved.topicId,
        }).catch(() => {});
      }

      res.json(resolved);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // ── FRM-TPC-005: Konu düzenleme talebi kuyruğu ──────────────────────────────
  router.get("/forum/edit-requests", authMiddleware, requireRole("admin", "moderator"), async (req, res) => {
    try {
      const limit = Math.min(Number(req.query.limit) || 50, 100);
      const offset = Number(req.query.offset) || 0;
      const requests = await repos.forum.getPendingEditRequests(limit, offset);
      res.json(requests);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  router.patch("/forum/edit-requests/:id", authMiddleware, requireRole("admin", "moderator"), async (req: AuthRequest, res) => {
    try {
      const { status, rejectionReason } = req.body;
      if (status !== "approved" && status !== "rejected") {
        return res.status(400).json({ error: "status 'approved' veya 'rejected' olmalı." });
      }
      if (status === "rejected" && (typeof rejectionReason !== "string" || rejectionReason.trim().length < 5)) {
        return res.status(400).json({ error: "Reddetme sebebi en az 5 karakter olmalı." });
      }

      const result = await repos.forum.resolveEditRequest(
        req.params.id as string,
        status,
        req.userId!,
        status === "rejected" ? rejectionReason.trim() : undefined
      );
      if (!result) return res.status(404).json({ error: "Talep bulunamadı." });

      if (status === "approved") {
        repos.notifications.create({
          userId: result.requesterId,
          type: "edit_approved",
          title: "Düzenleme talebiniz onaylandı",
          message: `"${result.newTitle}" başlıklı düzenleme talebiniz yayına alındı.`,
          targetType: "forum_topic",
          targetId: result.topicId,
        }).catch(() => {});
      } else {
        repos.notifications.create({
          userId: result.requesterId,
          type: "edit_rejected",
          title: "Düzenleme talebiniz reddedildi",
          message: `Düzenleme talebiniz reddedildi. Sebep: ${rejectionReason}`,
          targetType: "forum_topic",
          targetId: result.topicId,
        }).catch(() => {});
      }

      res.json({ ok: true, ...result });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // ── MOD-REP-002: Rapor kuyruğu ─────────────────────────────────────────────
  router.get("/reports", authMiddleware, requireRole("admin", "moderator"), async (req, res) => {
    try {
      const status = (req.query.status as string) || "pending";
      if (!["pending", "resolved", "dismissed"].includes(status)) {
        return res.status(400).json({ error: "Geçersiz status." });
      }
      const limit = Math.min(Number(req.query.limit) || 50, 100);
      const offset = Number(req.query.offset) || 0;
      const reports = await repos.reports.getByStatus(status as "pending" | "resolved" | "dismissed", limit, offset);
      res.json(reports);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  router.patch("/reports/:id", authMiddleware, requireRole("admin", "moderator"), async (req: AuthRequest, res) => {
    try {
      const { status, resolution } = req.body;
      if (status !== "resolved" && status !== "dismissed") {
        return res.status(400).json({ error: "status 'resolved' veya 'dismissed' olmalı." });
      }
      const report = await repos.reports.getById(req.params.id as string);
      if (!report) return res.status(404).json({ error: "Rapor bulunamadı." });

      await repos.reports.resolve(
        req.params.id as string,
        status,
        req.userId!,
        typeof resolution === "string" ? resolution.trim() : undefined
      );
      res.json({ ok: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  return router;
}