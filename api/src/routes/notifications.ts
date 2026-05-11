import { Router } from "express";
import { Repositories } from "../repositories";
import { authMiddleware, AuthRequest } from "../middleware/auth";

export function notificationRoutes(repos: Repositories): Router {
  const router = Router();

  router.get("/", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const notifs = await repos.notifications.getForUser(req.userId!);
      res.json(notifs);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  router.patch("/:id/read", authMiddleware, async (req: AuthRequest, res) => {
    try {
      await repos.notifications.markRead(req.params.id as string, req.userId!);
      res.json({ ok: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  router.patch("/read-all", authMiddleware, async (req: AuthRequest, res) => {
    try {
      await repos.notifications.markAllRead(req.userId!);
      res.json({ ok: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  router.get("/subscriptions", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const subs = await repos.notifications.getSubscriptions(req.userId!);
      res.json(subs);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  router.patch("/subscriptions/:countryId", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const { subscribed } = req.body;
      if (typeof subscribed !== "boolean") {
        return res.status(400).json({ error: "subscribed (boolean) gerekli" });
      }
      await repos.notifications.setSubscription(
        req.userId!,
        req.params.countryId as string,
        subscribed
      );
      res.json({ ok: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  return router;
}
