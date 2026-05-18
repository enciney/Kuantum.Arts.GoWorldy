import { Router } from "express";
import { Repositories } from "../repositories";
import { authMiddleware, AuthRequest } from "../middleware/auth";
import { ReportReason, ReportTargetType } from "../repositories/interfaces";

const VALID_REASONS: ReportReason[] = ["spam", "abuse", "misleading", "copyright", "other"];
const VALID_TARGETS: ReportTargetType[] = ["topic", "comment"];

/**
 * MOD-REP-001: İçerik raporlama akışı.
 * POST /api/reports — kullanıcılar konu veya yorum raporlayabilir.
 * Aynı kullanıcı aynı içeriği tekrar raporlayamaz (409).
 * Yeni rapor oluştuğunda admin/moderatorlere in-app bildirim gider.
 */
export function reportRoutes(repos: Repositories): Router {
  const router = Router();

  router.post("/", authMiddleware, async (req: AuthRequest, res) => {
    const { targetType, targetId, reason, description } = req.body;

    if (!VALID_TARGETS.includes(targetType)) {
      return res.status(400).json({ error: "targetType 'topic' veya 'comment' olmalı." });
    }
    if (typeof targetId !== "string" || !targetId) {
      return res.status(400).json({ error: "targetId zorunlu." });
    }
    if (!VALID_REASONS.includes(reason)) {
      return res.status(400).json({ error: `reason şunlardan biri olmalı: ${VALID_REASONS.join(", ")}` });
    }
    if (description !== undefined && typeof description !== "string") {
      return res.status(400).json({ error: "description metin olmalı." });
    }

    // Hedef gerçekten var mı?
    if (targetType === "topic") {
      const topic = await repos.forum.getTopicById(targetId);
      if (!topic) return res.status(404).json({ error: "Raporlanacak konu bulunamadı." });
    } else {
      const comment = await repos.forum.getCommentById(targetId);
      if (!comment) return res.status(404).json({ error: "Raporlanacak yorum bulunamadı." });
    }

    // Aynı raporu engelle
    const existing = await repos.reports.findByReporterAndTarget(req.userId!, targetType, targetId);
    if (existing) {
      return res.status(409).json({ error: "Bu içeriği zaten raporladınız.", report: existing });
    }

    const report = await repos.reports.create({
      reporterId: req.userId!,
      targetType,
      targetId,
      reason,
      description: description?.trim() || undefined,
    });

    // Admin/Moderator fan-out
    try {
      const [admins, mods, reporter] = await Promise.all([
        repos.users.findByRole("admin"),
        repos.users.findByRole("moderator"),
        repos.users.findById(req.userId!),
      ]);
      const staffIds = [...admins, ...mods].map((u) => u.id);
      const reporterName = reporter?.displayName ?? "Bir kullanıcı";
      await repos.notifications.notifyStaffOfReport(targetType, targetId, reason, reporterName, staffIds);
    } catch {
      /* best-effort */
    }

    res.status(201).json(report);
  });

  return router;
}
