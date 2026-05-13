import { Router } from "express";
import { Repositories } from "../repositories";
import { authMiddleware, AuthRequest } from "../middleware/auth";

export function guideRoutes(repos: Repositories): Router {
  const router = Router();

  router.get("/steps/:countryId", async (req, res) => {
    res.json(await repos.guide.getSteps(req.params.countryId));
  });

  router.get("/progress", authMiddleware, async (req: AuthRequest, res) => {
    res.json(await repos.guide.getUserProgress(req.userId!));
  });

  router.post("/progress", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const userId = req.userId!;
      const { stepId, answer, countryId } = req.body;

      if (!stepId || !answer || !countryId) {
        return res.status(400).json({ error: "stepId, answer, and countryId are required" });
      }

      const steps = await repos.guide.getSteps(countryId);
      const currentStep = steps.find((s) => s.id === stepId);
      if (!currentStep) {
        return res.status(404).json({ error: "Step not found" });
      }

      const existingProgress = await repos.guide.getUserProgress(userId);
      const hadPreviousAnswer = existingProgress.some((p) => p.stepId === stepId);
      const isChecklist = !currentStep.stepType || currentStep.stepType === "checklist";

      if (hadPreviousAnswer && isChecklist) {
        await repos.guide.resetAllChecklistProgress(userId, countryId);
      }

      const saved = await repos.guide.saveProgress({ userId, stepId, answer });

      const user = await repos.users.findById(userId);
      if (!user?.activeGuideCountryId) {
        await repos.users.update(userId, { activeGuideCountryId: countryId });
      }

      res.json(saved);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  router.get("/home-stats", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const userId = req.userId!;
      const user = await repos.users.findById(userId);
      if (!user?.activeGuideCountryId) {
        return res.json({
          countryId: null,
          countryName: "",
          completedSteps: 0,
          totalSteps: 0,
          completionPct: 0,
          countriesWithProgress: 0,
        });
      }
      const stats = await repos.guide.getUserHomeStats(userId, user.activeGuideCountryId);
      res.json(stats);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  router.put("/active-country", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const { countryId } = req.body;
      if (!countryId) {
        return res.status(400).json({ error: "countryId is required" });
      }
      await repos.users.update(req.userId!, { activeGuideCountryId: countryId });
      res.json({ ok: true, activeGuideCountryId: countryId });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  router.get("/progress/:countryId", authMiddleware, async (req: AuthRequest, res) => {
    const progress = await repos.guide.getUserProgressForCountry(req.userId!, req.params.countryId as string);
    res.json(progress);
  });

  return router;
}
