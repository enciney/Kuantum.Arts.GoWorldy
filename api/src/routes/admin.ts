import { Router } from "express";
import { Repositories } from "../repositories";
import { authMiddleware, requireRole, AuthRequest } from "../middleware/auth";
import { config } from "../config";

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

  return router;
}