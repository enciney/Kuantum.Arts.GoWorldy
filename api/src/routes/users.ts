import { Router } from "express";
import { Repositories } from "../repositories";
import { authMiddleware, AuthRequest } from "../middleware/auth";

/**
 * USR-PRV-002: Türkiye telefon numarası normalizasyonu.
 * Geçerli formatlar: +905XXXXXXXXX, 05XXXXXXXXX, 5XXXXXXXXX, +90 5XX XXX XX XX (boşluklu/dash'li)
 * Hepsi normalize edilir → "+905XXXXXXXXX" (E.164).
 * Geçersizse null döner.
 */
export function normalizePhoneTR(input: string): string | null {
  const digits = input.replace(/\D/g, "");
  if (!digits) return null;
  // +90 5XX XXX XX XX → 905XXXXXXXXX
  if (digits.length === 12 && digits.startsWith("90") && digits[2] === "5") return "+" + digits;
  if (digits.length === 11 && digits.startsWith("0") && digits[1] === "5") return "+90" + digits.slice(1);
  if (digits.length === 10 && digits[0] === "5") return "+90" + digits;
  return null;
}

export function userRoutes(repos: Repositories): Router {
  const router = Router();

  router.get("/me", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const user = await repos.users.findById(req.userId!);
      if (!user) return res.status(404).json({ error: "User not found" });

      // Süre dolmuş ama isPremium=true kalan kullanıcıları otomatik düzelt
      if (user.isPremium && user.premiumUntil && new Date(user.premiumUntil) <= new Date()) {
        await repos.users.update(user.id, { isPremium: false, premiumUntil: undefined, autoRenew: false });
        user.isPremium = false;
        user.premiumUntil = undefined;
        user.autoRenew = false;
      }

      const { passwordHash, ...safe } = user;
      res.json(safe);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  router.patch("/me", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const { displayName, bio, phoneNumber, sharePhoneNumber, avatarUrl, userType } = req.body;
      const VALID_USER_TYPES = ["emigrant", "consultant", "diaspora"] as const;
      type ValidUserType = typeof VALID_USER_TYPES[number];
      const allowed: Partial<{ displayName: string; bio: string; phoneNumber: string; sharePhoneNumber: boolean; avatarUrl: string; userType: ValidUserType }> = {};
      if (typeof displayName === "string" && displayName.trim()) {
        allowed.displayName = displayName.trim();
      }
      if (typeof bio === "string") {
        allowed.bio = bio;
      }
      if (typeof phoneNumber === "string") {
        // USR-PRV-002: telefon format validasyonu (TR)
        const trimmed = phoneNumber.trim();
        if (trimmed === "") {
          // boş string → telefonu temizle
          allowed.phoneNumber = "";
        } else {
          const normalized = normalizePhoneTR(trimmed);
          if (!normalized) {
            return res.status(400).json({
              error: "Geçerli bir Türkiye telefon numarası giriniz (örn: +905XXXXXXXXX veya 05XXXXXXXXX).",
              code: "INVALID_PHONE",
            });
          }
          allowed.phoneNumber = normalized;
        }
      }
      if (typeof sharePhoneNumber === "number" || typeof sharePhoneNumber === "boolean") {
        allowed.sharePhoneNumber = Boolean(sharePhoneNumber);
      }
      if (typeof avatarUrl === "string") {
        allowed.avatarUrl = avatarUrl;
      }
      if (typeof userType === "string" && (VALID_USER_TYPES as readonly string[]).includes(userType)) {
        allowed.userType = userType as ValidUserType;
      }
      const { onboardingCompleted, targetCountryId } = req.body;
      if (typeof onboardingCompleted === "boolean") {
        (allowed as any).onboardingCompleted = onboardingCompleted;
      }
      if (typeof targetCountryId === "string") {
        (allowed as any).targetCountryId = targetCountryId;
      }
      const { activeGuideCountryId } = req.body;
      if (typeof activeGuideCountryId === "string") {
        (allowed as any).activeGuideCountryId = activeGuideCountryId;
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

  router.get("/me/topics", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const limit = Math.min(Number(req.query.limit) || 20, 50);
      const offset = Number(req.query.offset) || 0;
      const topics = await repos.forum.getTopicsByAuthor(req.userId!, limit, offset);
      res.json(topics);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  router.get("/me/comments", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const limit = Math.min(Number(req.query.limit) || 20, 50);
      const offset = Number(req.query.offset) || 0;
      const comments = await repos.forum.getCommentsByAuthor(req.userId!, limit, offset);
      res.json(comments);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // FRM-TPC-008: Kullanıcının favorilediği konular
  router.get("/me/favorites", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const limit = Math.min(Number(req.query.limit) || 20, 50);
      const offset = Number(req.query.offset) || 0;
      const topics = await repos.forum.getFavoritesByUser(req.userId!, limit, offset);
      res.json(topics);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  router.get("/consultants", async (_req, res) => {
    try {
      const consultants = await repos.users.search({ userType: "consultant", limit: 50, offset: 0 });
      const safe = consultants.map(({ passwordHash, ...u }) => u);
      res.json(safe);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  router.get("/consultants/:id", async (req, res) => {
    try {
      const user = await repos.users.findById(req.params.id as string);
      if (!user || user.userType !== "consultant") {
        return res.status(404).json({ error: "Danışman bulunamadı" });
      }
      const { passwordHash, ...safe } = user;
      res.json(safe);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  return router;
}
