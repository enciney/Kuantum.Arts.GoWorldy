import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { config } from "./config";
import { createRepositories } from "./repositories";
import { authRoutes } from "./routes/auth";
import { forumRoutes } from "./routes/forum";
import { guideRoutes } from "./routes/guide";
import { paymentRoutes } from "./routes/payment";
import { adminRoutes } from "./routes/admin";
import { userRoutes } from "./routes/users";
import { notificationRoutes } from "./routes/notifications";
import { seedDatabase } from "./seed";

const app = express();
const allowedOrigins: string[] | boolean = process.env.CORS_ALLOWED_ORIGINS
  ? process.env.CORS_ALLOWED_ORIGINS.split(",")
  : true; // dev: tüm origin'lere izin ver; prod'da CORS_ALLOWED_ORIGINS env ile kısıtla
app.use(cors({ origin: allowedOrigins }));

// SEC-03: Rate limiting — RATE_LIMIT_AUTH_MAX / RATE_LIMIT_MAX env ile override edilebilir
const authRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_AUTH_MAX ?? "10"),
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Çok fazla istek gönderildi. Lütfen bir dakika sonra tekrar deneyin." },
});

const generalRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX ?? "100"),
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Çok fazla istek gönderildi. Lütfen bir dakika sonra tekrar deneyin." },
});

app.use("/api/auth/login", authRateLimit);
app.use("/api/auth/register", authRateLimit);
app.use("/api/auth/forgot-password", authRateLimit);
app.use("/api", generalRateLimit);

const repos = createRepositories();

// Stripe signature doğrulaması raw body ister — express.json()'dan önce mount edilmeli
const PREMIUM_DAYS: Record<string, number> = {
  premium_weekly: 7,
  premium_monthly: 30,
};

app.post("/api/payment/webhook", express.raw({ type: "application/json" }), async (req, res) => {
  const sig = req.headers["stripe-signature"] as string;
  if (!sig) return res.status(400).json({ error: "Missing stripe-signature header" });
  try {
    const result = await repos.payment.handleWebhook(req.body as Buffer, sig);
    if (result.event === "checkout.session.completed" && result.userId && result.productType) {
      const days = PREMIUM_DAYS[result.productType];
      if (days !== undefined) {
        const until = new Date();
        until.setDate(until.getDate() + days);
        await repos.users.update(result.userId, { isPremium: true, premiumUntil: until.toISOString() });
        await repos.userFeatures.addFeature(result.userId, result.productType, until.toISOString());
      }
    }
    res.json({ received: true });
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

app.use(express.json({ limit: "5mb" }));

seedDatabase();
repos.premium.seedDefaultPlans().catch(console.error);
// PRM-FST-002 main features ÖNCE seed edilmeli — PRM-FST-001 features mainFeatureKey lookup için ihtiyacı var
(async () => {
  try {
    await repos.premiumMainFeatures.seedDefaults();
    await repos.premiumFeatures.seedDefaults();
  } catch (e) {
    console.error(e);
  }
})();

app.use("/api/auth", authRoutes(repos));
app.use("/api/forum", forumRoutes(repos));
app.use("/api/guide", guideRoutes(repos));
app.use("/api/payment", paymentRoutes(repos));
app.use("/api/admin", adminRoutes(repos));
app.use("/api/users", userRoutes(repos));
app.use("/api/notifications", notificationRoutes(repos));

app.get("/", (_req, res) => res.json({ name: config.app.name, version: config.app.version }));
app.get("/api/health", (_req, res) => res.json({ status: "ok" }));

app.listen(config.port, () => {
  console.log(`${config.app.name} API running on http://localhost:${config.port}`);
});
