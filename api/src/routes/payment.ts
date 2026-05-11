import { Router } from "express";
import { Repositories } from "../repositories";
import { authMiddleware, AuthRequest } from "../middleware/auth";

const CREDIT_PACKAGES = [
  { id: "credits_50", name: "50 Kredi", credits: 50, priceTL: 50 },
  { id: "credits_100", name: "100 Kredi (Ekstra %10)", credits: 100, priceTL: 90 },
  { id: "credits_250", name: "250 Kredi (Ekstra %20)", credits: 250, priceTL: 200 },
];

const PREMIUM_PACKAGES = [
  { id: "premium_weekly", name: "Haftalık Premium", days: 7, priceTL: 50 },
  { id: "premium_monthly", name: "Aylık Premium", days: 30, priceTL: 250 },
];

export function paymentRoutes(repos: Repositories): Router {
  const router = Router();

  router.get("/packages", (_req, res) => {
    res.json({ credits: CREDIT_PACKAGES, premium: PREMIUM_PACKAGES });
  });

  router.post("/checkout", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const { priceId, productType, successUrl, cancelUrl } = req.body;
      if (!productType) {
        return res.status(400).json({ error: "productType zorunlu" });
      }
      const result = await repos.payment.createCheckoutSession({
        userId: req.userId!,
        priceId,
        productType,
        successUrl,
        cancelUrl,
      });
      res.json(result);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  return router;
}
