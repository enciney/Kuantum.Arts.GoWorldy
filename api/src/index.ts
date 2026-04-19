import express from "express";
import cors from "cors";
import { config } from "./config";
import { createRepositories } from "./repositories";
import { authRoutes } from "./routes/auth";
import { forumRoutes } from "./routes/forum";
import { guideRoutes } from "./routes/guide";
import { paymentRoutes } from "./routes/payment";
import { adminRoutes } from "./routes/admin";
import { seedDatabase } from "./seed";

const app = express();
app.use(cors());
app.use(express.json());

const repos = createRepositories();

seedDatabase();

app.use("/api/auth", authRoutes(repos));
app.use("/api/forum", forumRoutes(repos));
app.use("/api/guide", guideRoutes(repos));
app.use("/api/payment", paymentRoutes(repos));
app.use("/api/admin", adminRoutes(repos));

app.get("/", (_req, res) => res.json({ name: config.app.name, version: config.app.version }));
app.get("/api/health", (_req, res) => res.json({ status: "ok" }));

app.listen(config.port, () => {
  console.log(`${config.app.name} API running on http://localhost:${config.port}`);
});
