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
      const { displayName, bio, phoneNumber, sharePhoneNumber, avatarUrl } = req.body;
      const allowed: Partial<{ displayName: string; bio: string; phoneNumber: string; sharePhoneNumber: boolean; avatarUrl: string }> = {};
      if (typeof displayName === "string" && displayName.trim()) {
        allowed.displayName = displayName.trim();
      }
      if (typeof bio === "string") {
        allowed.bio = bio;
      }
      if (typeof phoneNumber === "string") {
        allowed.phoneNumber = phoneNumber;
      }
      if (typeof sharePhoneNumber === "number" || typeof sharePhoneNumber === "boolean") {
        allowed.sharePhoneNumber = Boolean(sharePhoneNumber);
      }
      if (typeof avatarUrl === "string") {
        allowed.avatarUrl = avatarUrl;
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
        completedSteps: new Set(progress.map((p) => p.stepId)).size,
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  router.get("/me/activity", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const userId = req.userId!;
      const [comments, steps] = await Promise.all([
        repos.forum.getRecentCommentsByAuthor(userId, 10),
        repos.guide.getRecentProgress(userId, 5),
      ]);

      const activities = [
        ...comments.map((c) => ({
          type: "comment" as const,
          id: c.id,
          title: `"${c.topicTitle}" konusuna yorum yaptın`,
          preview: c.content.slice(0, 100),
          targetId: c.topicId,
          createdAt: c.createdAt,
        })),
        ...steps.map((s) => ({
          type: "guide" as const,
          id: s.stepId,
          title: s.question,
          preview: s.answer.slice(0, 100),
          targetId: null as string | null,
          createdAt: s.completedAt,
        })),
      ]
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .slice(0, 10);

      res.json(activities);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  return router;
}
