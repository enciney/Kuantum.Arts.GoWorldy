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
    res.json(await repos.guide.saveProgress({ userId: req.userId!, ...req.body }));
  });

  return router;
}
