import { Router } from "express";
import { Repositories } from "../repositories";
import { authMiddleware, requireRole, AuthRequest } from "../middleware/auth";

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

    // TODO: gerçek kredi/premium sistemi eklendiğinde user için kredi düşür / premium kontrol et.
    // Şimdilik MVP: sadece admin/moderator yeni konu açabilir.
    if (!isStaff) {
      return res.status(402).json({
        error: "Yeni konu açmak için premium üyelik veya yeterli kredi gerekli.",
        code: "PAYMENT_REQUIRED",
      });
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

  router.patch("/topics/:id/status", authMiddleware, requireRole("admin", "moderator"), async (req, res) => {
    await repos.forum.updateTopicStatus(req.params.id as string, req.body.status);
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
