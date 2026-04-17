import express from "express";
import cors from "cors";
import { config } from "./config";
import { createRepositories } from "./repositories";
import { authRoutes } from "./routes/auth";
import { forumRoutes } from "./routes/forum";
import { guideRoutes } from "./routes/guide";
import { paymentRoutes } from "./routes/payment";

const app = express();
app.use(cors());
app.use(express.json());

const repos = createRepositories();

app.use("/api/auth", authRoutes(repos));
app.use("/api/forum", forumRoutes(repos));
app.use("/api/guide", guideRoutes(repos));
app.use("/api/payment", paymentRoutes(repos));

app.get("/", (_req, res) => res.json({ name: "GoWorldy API", version: "1.0.0" }));
app.get("/api/health", (_req, res) => res.json({ status: "ok" }));

app.listen(config.port, () => {
  console.log(`GoWorldy API running on http://localhost:${config.port}`);
});
