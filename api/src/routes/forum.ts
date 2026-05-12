import { Router } from "express";
import { Repositories } from "../repositories";
import { authMiddleware, requireRole, AuthRequest } from "../middleware/auth";
import { config } from "../config";

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

    const topic = await repos.forum.createTopic({
      categoryId,
      title,
      authorId: req.userId!,
      status: isStaff ? "approved" : "pending",
      isPinned: false,
    });
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

  router.patch("/topics/:id/status", authMiddleware, requireRole("admin", "moderator"), async (req, res) => {
    const { status, reason } = req.body;
    await repos.forum.updateTopicStatus(req.params.id as string, status, reason);
    res.json({ ok: true });
  });

  router.get("/topics/:topicId/comments", async (req, res) => {
    res.json(await repos.forum.getComments(req.params.topicId));
  });

  router.post("/topics/:topicId/comments", authMiddleware, async (req: AuthRequest, res) => {
    res.json(await repos.forum.createComment({ topicId: req.params.topicId as string, authorId: req.userId!, content: req.body.content }));
  });

  return router;
}
