import path from "path";
import dotenv from "dotenv";

const envFile = process.env.NODE_ENV === "production"
  ? ".env.production"
  : ".env.development";

dotenv.config({ path: path.resolve(__dirname, "../../config", envFile) });

export const config = {
  port: Number(process.env.PORT) || 3000,
  jwtSecret: process.env.JWT_SECRET || "dev-secret",

  db: {
    provider: (process.env.DB_PROVIDER || "sqlite") as "sqlite" | "mongodb",
    connectionString: process.env.DB_CONNECTION_STRING || "",
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
  },
};
