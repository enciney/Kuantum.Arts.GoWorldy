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

  router.get("/config", authMiddleware, requireRole("admin"), async (_req, res) => {
    res.json({
      app: config.app,
      forum: config.forum,
      premium: config.premium,
      guide: config.guide,
      notifications: config.notifications,
    });
  });

  router.get("/config/forum/pricing", authMiddleware, requireRole("admin"), async (_req, res) => {
    res.json({
      createTopicCost: config.forum.createTopicCost,
      commentAccessCost: config.forum.commentAccessCost,
      createAdCost: config.forum.createAdCost,
      weeklyTopicReward: config.forum.weeklyTopicReward,
    });
  });

  router.get("/config/premium/pricing", authMiddleware, requireRole("admin"), async (_req, res) => {
    res.json({
      weeklyPrice: config.premium.weeklyPrice,
      monthlyPrice: config.premium.monthlyPrice,
      credits: config.premium.credits,
    });
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
      const { name, description, price, durationDays, features, isActive } = req.body;
      if (!name || price == null || !durationDays) {
        return res.status(400).json({ error: "name, price, durationDays zorunlu" });
      }
      const plan = await repos.premium.createPlan({
        name,
        description: description ?? "",
        price: Number(price),
        durationDays: Number(durationDays),
        features: features ?? [],
        isActive: isActive !== false,
      });
      res.status(201).json(plan);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  router.patch("/premium/plans/:id", authMiddleware, requireRole("admin"), async (req, res) => {
    try {
      const { name, description, price, durationDays, features, isActive } = req.body;
      const update: Record<string, unknown> = {};
      if (name !== undefined) update.name = name;
      if (description !== undefined) update.description = description;
      if (price !== undefined) update.price = Number(price);
      if (durationDays !== undefined) update.durationDays = Number(durationDays);
      if (features !== undefined) update.features = features;
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

  return router;
}