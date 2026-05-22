import { Router } from "express";
import { Repositories } from "../repositories";
import { authMiddleware, AuthRequest } from "../middleware/auth";
import { config } from "../config";

const PREMIUM_DAYS: Record<string, number> = {
  premium_weekly:  7,
  premium_monthly: 30,
};

const PRICE_MAP: Record<string, string> = {
  premium_weekly:  config.stripe.prices.premium_weekly,
  premium_monthly: config.stripe.prices.premium_monthly,
};

export function paymentRoutes(repos: Repositories): Router {
  const router = Router();

  // GET /packages — aktif premium planları döner
  router.get("/packages", async (_req, res) => {
    try {
      const plans = await repos.premium.getPlans();
      const premiumPackages = plans
        .filter((p) => p.isActive)
        .map((p) => ({
          id: p.id,
          name: p.name,
          description: p.description,
          days: p.durationDays,
          priceTL: p.price,
          features: p.features,
          isSubscription: p.isSubscription,
          subscriptionDiscountPercent: p.subscriptionDiscountPercent,
        }));
      res.json({ premium: premiumPackages });
    } catch {
      res.json({ premium: [] });
    }
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

  // POST /process — simüle ödeme (Stripe olmadan anlık premium ver)
  // autoRenew: subscription planlar için indirim ve otomatik yenileme onayı
  router.post("/process", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const { productType, autoRenew } = req.body;
      if (!productType) {
        return res.status(400).json({ error: "productType zorunlu" });
      }

      // DB'deki premium plan
      const plan = await repos.premium.getPlanById(productType);
      if (!plan || !plan.isActive) {
        return res.status(400).json({ error: `Geçersiz productType: ${productType}` });
      }

      const wantsAutoRenew = autoRenew === true && plan.isSubscription;
      const discountPct = wantsAutoRenew ? (plan.subscriptionDiscountPercent ?? 0) : 0;
      const chargedTL = Math.round(plan.price * (100 - discountPct)) / 100;

      // PAY-SPN-002: non-subscription planlar için duplicate ownership kontrolü
      if (!plan.isSubscription && (plan.featureKeys ?? []).length > 0) {
        const ownershipChecks = await Promise.all(
          (plan.featureKeys ?? []).map((key) => repos.userFeatures.hasFeature(req.userId!, key))
        );
        if (ownershipChecks.every(Boolean)) {
          return res.status(409).json({ error: "Bu özelliğe zaten sahipsiniz.", code: "ALREADY_OWNED" });
        }
      }

      // Feature key'lerini userFeatures'a yaz (plan süresine kadar TTL)
      const now = new Date();
      const expiresAt = new Date(now.getTime() + plan.durationDays * 86_400_000).toISOString();
      for (const key of plan.featureKeys ?? []) {
        await repos.userFeatures.addFeature(req.userId!, key, expiresAt);
      }

      // Subscription ise isPremium = true + premiumUntil uzat
      if (plan.isSubscription) {
        const existing = await repos.users.findById(req.userId!);
        const base = existing?.premiumUntil && new Date(existing.premiumUntil) > now
          ? new Date(existing.premiumUntil)
          : now;
        const premiumUntil = new Date(base.getTime() + plan.durationDays * 86_400_000).toISOString();
        await repos.users.update(req.userId!, {
          isPremium: true,
          premiumUntil,
          autoRenew: wantsAutoRenew,
        });
      }

      const user = await repos.users.findById(req.userId!);
      res.json({
        ok: true,
        isPremium:    user?.isPremium     ?? false,
        premiumUntil: user?.premiumUntil  ?? null,
        autoRenew:    wantsAutoRenew,
        chargedTL,
        discountPct,
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // POST /checkout — Stripe checkout session oluştur
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
