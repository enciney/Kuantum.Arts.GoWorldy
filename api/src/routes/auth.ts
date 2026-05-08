import { Router } from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { config } from "../config";
import { Repositories } from "../repositories";
import { isGoogleConfigured, verifyGoogleIdToken } from "../services/google-auth";

export function authRoutes(repos: Repositories): Router {
  const router = Router();

  router.post("/register", async (req, res) => {
    try {
      const { email, password, displayName, userType } = req.body;
      const existing = await repos.users.findByEmail(email);
      if (existing) return res.status(400).json({ error: "Email already registered" });

      const passwordHash = await bcrypt.hash(password, 10);
      const user = await repos.users.create({ email, passwordHash, displayName, role: config.roles.user, userType: userType || config.userTypes.emigrant });
      const token = jwt.sign({ id: user.id, role: user.role }, config.jwtSecret, { expiresIn: config.jwtExpiry } as object);
      res.json({ user: { id: user.id, email: user.email, displayName: user.displayName, role: user.role }, token });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  router.post("/forgot-password", async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) return res.status(400).json({ error: "Email zorunlu" });

      const user = await repos.users.findByEmail(email);
      // Security: e-posta var/yok olduğunu sızdırma — her zaman 200 dön.
      if (user) {
        const resetToken = jwt.sign(
          { id: user.id, purpose: "reset" },
          config.jwtSecret,
          { expiresIn: "1h" } as object
        );
        // TODO: gerçek e-posta servisi entegrasyonu (SendGrid/SES). Şimdilik log.
        console.log(`[forgot-password] reset token for ${email}: ${resetToken}`);
      }
      res.json({ ok: true, message: "Eğer hesap varsa sıfırlama bağlantısı e-posta ile gönderildi." });
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

      const token = jwt.sign({ id: user.id, role: user.role }, config.jwtSecret, { expiresIn: config.jwtExpiry } as object);
      res.json({ user: { id: user.id, email: user.email, displayName: user.displayName, role: user.role }, token });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  router.post("/reset-password", async (req, res) => {
    try {
      const { token: resetToken, newPassword } = req.body;
      if (!resetToken || !newPassword) {
        return res.status(400).json({ error: "Token ve yeni şifre zorunlu" });
      }
      if (newPassword.length < 6) {
        return res.status(400).json({ error: "Şifre en az 6 karakter olmalı" });
      }

      let decoded: { id: string; purpose: string };
      try {
        decoded = jwt.verify(resetToken, config.jwtSecret) as { id: string; purpose: string };
      } catch {
        return res.status(401).json({ error: "Geçersiz veya süresi dolmuş token" });
      }
      if (decoded.purpose !== "reset") {
        return res.status(401).json({ error: "Bu token şifre sıfırlama için geçerli değil" });
      }

      const user = await repos.users.findById(decoded.id);
      if (!user) return res.status(404).json({ error: "Kullanıcı bulunamadı" });

      const passwordHash = await bcrypt.hash(newPassword, 10);
      await repos.users.update(user.id, { passwordHash });

      res.json({ ok: true, message: "Şifre güncellendi. Yeni şifrenizle giriş yapabilirsiniz." });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  router.post("/google", async (req, res) => {
    try {
      if (!isGoogleConfigured()) {
        return res.status(503).json({
          error: "Google Sign-In henüz yapılandırılmadı. Sunucuda GOOGLE_WEB_CLIENT_ID, GOOGLE_IOS_CLIENT_ID veya GOOGLE_ANDROID_CLIENT_ID ayarlanmalı.",
        });
      }

      const { idToken } = req.body;
      if (!idToken) return res.status(400).json({ error: "idToken zorunlu" });

      const verified = await verifyGoogleIdToken(idToken);

      let user = await repos.users.findByEmail(verified.email);
      if (!user) {
        const randomPassword = crypto.randomBytes(24).toString("hex");
        const passwordHash = await bcrypt.hash(randomPassword, 10);
        user = await repos.users.create({
          email: verified.email,
          passwordHash,
          displayName: verified.name || verified.email.split("@")[0],
          role: config.roles.user,
          userType: config.userTypes.emigrant,
        });
      }

      const token = jwt.sign(
        { id: user.id, role: user.role },
        config.jwtSecret,
        { expiresIn: config.jwtExpiry } as object
      );

      res.json({
        user: {
          id: user.id,
          email: user.email,
          displayName: user.displayName,
          role: user.role,
        },
        token,
      });
    } catch (e: any) {
      res.status(401).json({ error: e.message || "Google doğrulama başarısız" });
    }
  });

  return router;
}
