import { Router } from "express";
import { Repositories } from "../repositories";
import { authMiddleware, AuthRequest } from "../middleware/auth";

export function paymentRoutes(repos: Repositories): Router {
  const router = Router();

  router.post("/checkout", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const result = await repos.payment.createCheckoutSession({
        userId: req.userId!,
        priceId: req.body.priceId,
        successUrl: req.body.successUrl,
        cancelUrl: req.body.cancelUrl,
      });
      res.json(result);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  return router;
}
