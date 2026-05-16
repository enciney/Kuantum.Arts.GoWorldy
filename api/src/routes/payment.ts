import { Router } from "express";
import { Repositories } from "../repositories";
import { authMiddleware, AuthRequest } from "../middleware/auth";
import { config } from "../config";

const ACTION_COSTS: Record<string, number> = {
  credits_topic:   50,
  credits_reply:   50,
  credits_message: 50,
};

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

  // GET /my-features — kullanıcının aktif özelliklerini listele
  router.get("/my-features", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const features = await repos.userFeatures.getActiveFeatures(req.userId!);
      res.json(features);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Spend credits for an action (credits_topic / credits_reply / credits_message)
  router.post("/spend-credit", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const { actionType } = req.body;
      const cost = ACTION_COSTS[actionType];
      if (cost == null) {
        return res.status(400).json({ error: `Geçersiz aksiyon türü: ${actionType}` });
      }

      // P10-1: Özellik zaten aktifse 409 dön
      const alreadyOwned = await repos.userFeatures.hasFeature(req.userId!, actionType);
      if (alreadyOwned) {
        return res.status(409).json({
          error: "Zaten bu özelliğe sahipsiniz.",
          code: "ALREADY_OWNED",
        });
      }

      const deducted = await repos.users.deductCredits(req.userId!, cost);
      if (!deducted) {
        const user = await repos.users.findById(req.userId!);
        return res.status(402).json({
          error: "Yetersiz kredi.",
          code: "INSUFFICIENT_CREDITS",
          required: cost,
          balance: user?.credits ?? 0,
        });
      }

      // Özelliği kaydet (30 gün geçerli)
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      await repos.userFeatures.addFeature(req.userId!, actionType, expiresAt);

      const user = await repos.users.findById(req.userId!);
      res.json({ ok: true, credits: user?.credits ?? 0 });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Dev/test endpoint — adds 50 credits instantly without Stripe
  router.post("/topup/mock", authMiddleware, async (req: AuthRequest, res) => {
    try {
      await repos.users.addCredits(req.userId!, 50);
      const user = await repos.users.findById(req.userId!);
      res.json({ ok: true, credits: user?.credits ?? 0 });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
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
