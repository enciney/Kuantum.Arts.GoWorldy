import { Router } from "express";
import { Repositories } from "../repositories";
import { authMiddleware, AuthRequest } from "../middleware/auth";
import { config } from "../config";

const CREDIT_PACKAGES = [
  { id: "credits_50", name: "50 Kredi", credits: 50, priceTL: 50 },
  { id: "credits_100", name: "100 Kredi (Ekstra %10)", credits: 100, priceTL: 90 },
  { id: "credits_250", name: "250 Kredi (Ekstra %20)", credits: 250, priceTL: 200 },
];

const PREMIUM_PACKAGES = [
  { id: "premium_weekly", name: "Haftalık Premium", days: 7, priceTL: 50 },
  { id: "premium_monthly", name: "Aylık Premium", days: 30, priceTL: 250 },
];

const PRICE_MAP: Record<string, string> = {
  credits_50: config.stripe.prices.credits_50,
  credits_100: config.stripe.prices.credits_100,
  credits_250: config.stripe.prices.credits_250,
  premium_weekly: config.stripe.prices.premium_weekly,
  premium_monthly: config.stripe.prices.premium_monthly,
  credits_topic: config.stripe.prices.credits_topic,
  credits_comment: config.stripe.prices.credits_comment,
  credits_ad: config.stripe.prices.credits_ad,
};

export function paymentRoutes(repos: Repositories): Router {
  const router = Router();

  router.get("/packages", (_req, res) => {
    res.json({ credits: CREDIT_PACKAGES, premium: PREMIUM_PACKAGES });
  });

  router.post("/checkout", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const { productType, successUrl, cancelUrl } = req.body;
      if (!productType) {
        return res.status(400).json({ error: "productType zorunlu" });
      }
      const priceId = PRICE_MAP[productType];
      if (!priceId) {
        return res.status(400).json({
          error: `'${productType}' için Stripe fiyatı yapılandırılmamış. STRIPE_PRICE_${productType.toUpperCase()} ortam değişkenini ayarlayın.`,
        });
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
