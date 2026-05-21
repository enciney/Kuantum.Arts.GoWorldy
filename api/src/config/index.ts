import path from "path";
import dotenv from "dotenv";

const envFile = process.env.NODE_ENV === "production"
  ? ".env.production"
  : ".env.development";

dotenv.config({ path: path.resolve(__dirname, "../../../config", envFile) });

export const config = {
  port: Number(process.env.PORT) || 3000,
  jwtSecret: process.env.JWT_SECRET || "dev-secret",
  jwtExpiry: process.env.JWT_EXPIRY || "7d",

  db: {
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
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL || "",
    privateKey: (process.env.FIREBASE_PRIVATE_KEY || "").replace(/\\n/g, "\n"),
  },

  google: {
    webClientId: process.env.GOOGLE_WEB_CLIENT_ID || "",
    iosClientId: process.env.GOOGLE_IOS_CLIENT_ID || "",
    androidClientId: process.env.GOOGLE_ANDROID_CLIENT_ID || "",
  },

  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY || "",
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || "",
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || "",
    prices: {
      premium_weekly: process.env.STRIPE_PRICE_PREMIUM_WEEKLY || "",
      premium_monthly: process.env.STRIPE_PRICE_PREMIUM_MONTHLY || "",
    },
  },

  sendgrid: {
    apiKey: process.env.SENDGRID_API_KEY || "",
    fromEmail: process.env.SENDGRID_FROM_EMAIL || "noreply@goworldy.com",
  },

  admin: {
    email: process.env.ADMIN_EMAIL || "admin@goworldy.com",
    defaultPassword: process.env.ADMIN_DEFAULT_PASSWORD || "admin123",
  },

  roles: {
    admin: "admin" as const,
    moderator: "moderator" as const,
    user: "user" as const,
  },

  userTypes: {
    emigrant: "emigrant" as const,
    consultant: "consultant" as const,
    diaspora: "diaspora" as const,
  },

  forum: {
    commentEditWindowMinutes: Number(process.env.COMMENT_EDIT_WINDOW_MINUTES) || 15,
    commentDeleteWindowMinutes: Number(process.env.COMMENT_DELETE_WINDOW_MINUTES) || 15,
  },

  premium: {
    weeklyPrice: Number(process.env.PREMIUM_WEEKLY_PRICE) || 50,
    monthlyPrice: Number(process.env.PREMIUM_MONTHLY_PRICE) || 250,
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
