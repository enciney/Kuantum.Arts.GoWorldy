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
    res.json(await repos.forum.createTopic({ ...req.body, authorId: req.userId!, status: "pending", isPinned: false }));
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
