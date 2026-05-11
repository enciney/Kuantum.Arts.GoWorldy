import express from "express";
import cors from "cors";
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
const allowedOrigins = process.env.CORS_ALLOWED_ORIGINS
  ? process.env.CORS_ALLOWED_ORIGINS.split(",")
  : ["http://localhost:3000", "http://localhost:5173", "http://localhost:19006"];
app.use(cors({ origin: allowedOrigins }));

const repos = createRepositories();

// Stripe signature doğrulaması raw body ister — express.json()'dan önce mount edilmeli
const CREDITS_GRANT: Record<string, number> = {
  credits_50: 50,
  credits_100: 100,
  credits_250: 250,
  credits_topic: 50,
  credits_comment: 50,
  credits_ad: 50,
};
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
      const credits = CREDITS_GRANT[result.productType];
      const days = PREMIUM_DAYS[result.productType];
      if (credits !== undefined) {
        await repos.users.addCredits(result.userId, credits);
      } else if (days !== undefined) {
        const until = new Date();
        until.setDate(until.getDate() + days);
        await repos.users.update(result.userId, { isPremium: true, premiumUntil: until.toISOString() });
      }
    }
    res.json({ received: true });
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

app.use(express.json());

seedDatabase();

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
