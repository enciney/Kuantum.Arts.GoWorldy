import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { config } from "../config";
import { Repositories } from "../repositories";

export function authRoutes(repos: Repositories): Router {
  const router = Router();

  router.post("/register", async (req, res) => {
    try {
      const { email, password, displayName, userType } = req.body;
      const existing = await repos.users.findByEmail(email);
      if (existing) return res.status(400).json({ error: "Email already registered" });

      const passwordHash = await bcrypt.hash(password, 10);
      const user = await repos.users.create({ email, passwordHash, displayName, role: config.roles.user, userType: userType || config.userTypes.emigrant });
      const token = jwt.sign({ id: user.id, role: user.role }, config.jwtSecret, { expiresIn: config.jwtExpiry });
      res.json({ user: { id: user.id, email: user.email, displayName: user.displayName, role: user.role }, token });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  router.post("/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      const user = await repos.users.findByEmail(email);
      if (!user) return res.status(401).json({ error: "Invalid email or password" });

      const valid = await bcrypt.compare(password, user.passwordHash);
      if (!valid) return res.status(401).json({ error: "Invalid email or password" });

      const token = jwt.sign({ id: user.id, role: user.role }, config.jwtSecret, { expiresIn: config.jwtExpiry });
      res.json({ user: { id: user.id, email: user.email, displayName: user.displayName, role: user.role }, token });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  return router;
}
