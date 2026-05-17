import request from "supertest";
import jwt from "jsonwebtoken";
import { createApp } from "../../src/app";
import { closeDbConnection, resetDbConnection } from "../../src/repositories/mongodb/db";
import type { Express } from "express";

let app: Express;

beforeAll(async () => {
  resetDbConnection();
  app = createApp({ skipRateLimit: true });
  // Warm up connection
  await request(app).get("/api/health");
});

afterAll(async () => {
  await closeDbConnection();
});

// ── Health ──────────────────────────────────────────────────────────────────
describe("Health", () => {
  it("GET /api/health → 200 { status: 'ok' }", async () => {
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
  });
});

// ── Register ────────────────────────────────────────────────────────────────
describe("POST /api/auth/register", () => {
  it("happy path → 200 with user + token", async () => {
    const res = await request(app).post("/api/auth/register").send({
      email: "alice@test.com",
      password: "password123",
      displayName: "Alice",
      userType: "emigrant",
    });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe("alice@test.com");
    expect(res.body.user.passwordHash).toBeUndefined();
  });

  it("duplicate email → 400", async () => {
    // Register first
    await request(app).post("/api/auth/register").send({
      email: "dup@test.com",
      password: "password123",
      displayName: "Dup",
      userType: "emigrant",
    });
    // Try again
    const res = await request(app).post("/api/auth/register").send({
      email: "dup@test.com",
      password: "password123",
      displayName: "Dup2",
      userType: "emigrant",
    });
    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it("missing password → 500 or 400", async () => {
    const res = await request(app).post("/api/auth/register").send({
      email: "nopass@test.com",
      displayName: "NoPass",
    });
    expect(res.status).toBeGreaterThanOrEqual(400);
  });
});

// ── Login ────────────────────────────────────────────────────────────────────
describe("POST /api/auth/login", () => {
  beforeAll(async () => {
    await request(app).post("/api/auth/register").send({
      email: "bob@test.com",
      password: "bobpass123",
      displayName: "Bob",
      userType: "emigrant",
    });
  });

  it("happy path → 200 with token", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: "bob@test.com",
      password: "bobpass123",
    });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
  });

  it("wrong password → 401", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: "bob@test.com",
      password: "wrongpassword",
    });
    expect(res.status).toBe(401);
  });

  it("unknown email → 401", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: "nobody@test.com",
      password: "whatever",
    });
    expect(res.status).toBe(401);
  });
});

// ── Forgot Password ──────────────────────────────────────────────────────────
describe("POST /api/auth/forgot-password", () => {
  it("existing email → 200 (no info leak)", async () => {
    await request(app).post("/api/auth/register").send({
      email: "forgot@test.com",
      password: "forgot123",
      displayName: "ForgotUser",
      userType: "emigrant",
    });
    const res = await request(app).post("/api/auth/forgot-password").send({
      email: "forgot@test.com",
    });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  it("non-existing email → 200 (no user existence leak)", async () => {
    const res = await request(app).post("/api/auth/forgot-password").send({
      email: "doesnotexist@test.com",
    });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  it("missing email → 400", async () => {
    const res = await request(app).post("/api/auth/forgot-password").send({});
    expect(res.status).toBe(400);
  });
});

// ── Reset Password ───────────────────────────────────────────────────────────
describe("POST /api/auth/reset-password", () => {
  let validResetToken: string;
  let userId: string;

  beforeAll(async () => {
    // Create a user to reset
    const reg = await request(app).post("/api/auth/register").send({
      email: "reset@test.com",
      password: "oldpass123",
      displayName: "ResetUser",
      userType: "emigrant",
    });
    userId = reg.body.user.id;
    // Create a valid reset token
    validResetToken = jwt.sign(
      { id: userId, purpose: "reset" },
      process.env.JWT_SECRET || "dev-secret",
      { expiresIn: "1h" }
    );
  });

  it("valid token + valid password → 200", async () => {
    const res = await request(app).post("/api/auth/reset-password").send({
      token: validResetToken,
      newPassword: "newpass123",
    });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  it("invalid token → 401", async () => {
    const res = await request(app).post("/api/auth/reset-password").send({
      token: "invalid.token.here",
      newPassword: "newpass123",
    });
    expect(res.status).toBe(401);
  });

  it("short password → 400", async () => {
    const shortToken = jwt.sign(
      { id: userId, purpose: "reset" },
      process.env.JWT_SECRET || "dev-secret",
      { expiresIn: "1h" }
    );
    const res = await request(app).post("/api/auth/reset-password").send({
      token: shortToken,
      newPassword: "abc",
    });
    expect(res.status).toBe(400);
  });

  it("missing fields → 400", async () => {
    const res = await request(app).post("/api/auth/reset-password").send({});
    expect(res.status).toBe(400);
  });

  it("wrong purpose token → 401", async () => {
    const wrongPurposeToken = jwt.sign(
      { id: userId, purpose: "login" },
      process.env.JWT_SECRET || "dev-secret",
      { expiresIn: "1h" }
    );
    const res = await request(app).post("/api/auth/reset-password").send({
      token: wrongPurposeToken,
      newPassword: "validpass123",
    });
    expect(res.status).toBe(401);
  });
});

// ── SEC-01: Expired JWT ───────────────────────────────────────────────────────
describe("SEC-01: Expired JWT", () => {
  it("GET /api/users/me with expired token → 401", async () => {
    const expiredToken = jwt.sign(
      { id: "someuser", role: "user" },
      process.env.JWT_SECRET || "dev-secret",
      { expiresIn: -1 } // already expired
    );
    const res = await request(app)
      .get("/api/users/me")
      .set("Authorization", `Bearer ${expiredToken}`);
    expect(res.status).toBe(401);
  });
});

// ── SEC-06: passwordHash not in response ──────────────────────────────────────
describe("SEC-06: passwordHash not exposed", () => {
  it("GET /api/users/me must NOT contain passwordHash", async () => {
    // Register + login
    const reg = await request(app).post("/api/auth/register").send({
      email: "sec06@test.com",
      password: "sec06pass",
      displayName: "SEC06User",
      userType: "emigrant",
    });
    const token = reg.body.token;

    const res = await request(app)
      .get("/api/users/me")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.passwordHash).toBeUndefined();
  });
});
