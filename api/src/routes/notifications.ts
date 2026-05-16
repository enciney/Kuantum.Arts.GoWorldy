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

  router.get("/unread-count", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const count = await repos.notifications.getUnreadCount(req.userId!);
      res.json({ count });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  router.patch("/:id/read", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const notifId = req.params.id as string;
      const updated = await repos.notifications.markReadOwned(notifId, req.userId!);
      if (!updated) {
        return res.status(403).json({ error: "Bu bildirime erişim izniniz yok veya bildirim bulunamadı." });
      }
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

  // ── Country subscriptions ────────────────────────────────────────────────────

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

  // ── Topic subscriptions ──────────────────────────────────────────────────────

  router.get("/topic-subscriptions", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const subs = await repos.notifications.getTopicSubscriptions(req.userId!);
      res.json(subs);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  return router;
}
