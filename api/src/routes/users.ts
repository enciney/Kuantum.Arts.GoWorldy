import { Router } from "express";
import { Repositories } from "../repositories";
import { authMiddleware, AuthRequest } from "../middleware/auth";

export function userRoutes(repos: Repositories): Router {
  const router = Router();

  router.get("/me", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const user = await repos.users.findById(req.userId!);
      if (!user) return res.status(404).json({ error: "User not found" });
      const { passwordHash, ...safe } = user;
      res.json(safe);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  router.patch("/me", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const { displayName, bio } = req.body;
      const allowed: Partial<{ displayName: string; bio: string }> = {};
      if (typeof displayName === "string" && displayName.trim()) {
        allowed.displayName = displayName.trim();
      }
      if (typeof bio === "string") {
        allowed.bio = bio;
      }
      if (Object.keys(allowed).length === 0) {
        return res.status(400).json({ error: "Güncellenecek alan yok" });
      }
      await repos.users.update(req.userId!, allowed);
      const updated = await repos.users.findById(req.userId!);
      if (!updated) return res.status(404).json({ error: "User not found" });
      const { passwordHash, ...safe } = updated;
      res.json(safe);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  router.get("/me/stats", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const userId = req.userId!;
      const [topicCount, commentCount, progress] = await Promise.all([
        repos.forum.countTopicsByAuthor(userId),
        repos.forum.countCommentsByAuthor(userId),
        repos.guide.getUserProgress(userId),
      ]);
      res.json({
        topicCount,
        commentCount,
        followingCount: 0, // TODO: follow sistemi henüz yok
        completedSteps: progress.length,
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  return router;
}
