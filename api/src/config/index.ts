import path from "path";
import dotenv from "dotenv";

const envFile = process.env.NODE_ENV === "production"
  ? ".env.production"
  : ".env.development";

dotenv.config({ path: path.resolve(__dirname, "../../config", envFile) });

export const config = {
  port: Number(process.env.PORT) || 3000,
  jwtSecret: process.env.JWT_SECRET || "dev-secret",
  jwtExpiry: process.env.JWT_EXPIRY || "7d",

  db: {
    provider: (process.env.DB_PROVIDER || "sqlite") as "sqlite" | "mongodb",
    connectionString: process.env.DB_CONNECTION_STRING || "",
  },

  app: {
    name: process.env.APP_NAME || "GoWorldy",
    version: process.env.APP_VERSION || "1.0.0",
    url: process.env.APP_URL || "http://localhost:3000",
  },

  firebase: {
    apiKey: process.env.FIREBASE_API_KEY || "",
    authDomain: process.env.FIREBASE_AUTH_DOMAIN || "",
    projectId: process.env.FIREBASE_PROJECT_ID || "",
  },

  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY || "",
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || "",
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || "",
  },

  admin: {
    email: process.env.ADMIN_EMAIL || "admin@goworldy.com",
    defaultPassword: process.env.ADMIN_DEFAULT_PASSWORD || "admin123",
  },

  roles: {
    admin: "admin",
    moderator: "moderator",
    user: "user",
  },

  userTypes: {
    emigrant: "emigrant",
    consultant: "consultant",
    diaspora: "diaspora",
  },

  forum: {
    createTopicCost: Number(process.env.FORUM_CREATE_TOPIC_COST) || 50,
    commentAccessCost: Number(process.env.FORUM_COMMENT_ACCESS_COST) || 50,
    createAdCost: Number(process.env.FORUM_CREATE_AD_COST) || 50,
    weeklyTopicReward: Number(process.env.FORUM_WEEKLY_TOPIC_REWARD) || 1,
  },

  premium: {
    weeklyPrice: Number(process.env.PREMIUM_WEEKLY_PRICE) || 50,
    monthlyPrice: Number(process.env.PREMIUM_MONTHLY_PRICE) || 250,
    credits: {
      createTopic: 1,
      commentWeek: 1,
      createAd: 1,
    },
  },

  guide: {
    enableNotifications: process.env.GUIDE_ENABLE_NOTIFICATIONS !== "false",
    enableRecommendations: process.env.GUIDE_ENABLE_RECOMMENDATIONS !== "false",
  },

  notifications: {
    enableEmail: process.env.NOTIFICATIONS_ENABLE_EMAIL !== "false",
    enableInApp: process.env.NOTIFICATIONS_ENABLE_IN_APP !== "false",
  },
};
