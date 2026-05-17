import request from "supertest";
import { createApp } from "../../src/app";
import { closeDbConnection, resetDbConnection, getCollections } from "../../src/repositories/mongodb/db";
import type { Express } from "express";

let app: Express;
let userToken: string;
let userId: string;
let adminToken: string;
let adminId: string;

async function makeAdmin(email: string) {
  const { users } = await getCollections();
  await users.updateOne({ email }, { $set: { role: "admin" } });
}

async function setCredits(uid: string, amount: number) {
  const { users } = await getCollections();
  await users.updateOne({ _id: uid }, { $set: { credits: amount } });
}

beforeAll(async () => {
  resetDbConnection();
  app = createApp({ skipRateLimit: true });
  await request(app).get("/api/health");

  // Create normal user
  const userRes = await request(app).post("/api/auth/register").send({
    email: "premium_user@test.com",
    password: "premiumpass123",
    displayName: "PremiumUser",
    userType: "emigrant",
  });
  userToken = userRes.body.token;
  userId = userRes.body.user.id;

  // Create admin
  const adminRes = await request(app).post("/api/auth/register").send({
    email: "premium_admin@test.com",
    password: "adminpass123",
    displayName: "PremiumAdmin",
    userType: "emigrant",
  });
  adminId = adminRes.body.user.id;
  await makeAdmin("premium_admin@test.com");
  const adminLogin = await request(app).post("/api/auth/login").send({
    email: "premium_admin@test.com",
    password: "adminpass123",
  });
  adminToken = adminLogin.body.token;
});

afterAll(async () => {
  await closeDbConnection();
});

// ── Packages ──────────────────────────────────────────────────────────────────
describe("GET /api/payment/packages", () => {
  it("→ 200 { credits: [...], premium: [...] }", async () => {
    const res = await request(app).get("/api/payment/packages");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.credits)).toBe(true);
    expect(Array.isArray(res.body.premium)).toBe(true);
  });
});

// ── Mock Topup ────────────────────────────────────────────────────────────────
describe("POST /api/payment/topup/mock", () => {
  it("→ 200, user credits +50", async () => {
    const before = await request(app)
      .get("/api/users/me")
      .set("Authorization", `Bearer ${userToken}`);
    const creditsBefore = before.body.credits;

    const res = await request(app)
      .post("/api/payment/topup/mock")
      .set("Authorization", `Bearer ${userToken}`);
    expect(res.status).toBe(200);
    expect(res.body.credits).toBe(creditsBefore + 50);
  });
});

// ── Spend Credits ─────────────────────────────────────────────────────────────
describe("POST /api/payment/spend-credit", () => {
  beforeAll(async () => {
    // Ensure user has enough credits
    await setCredits(userId, 200);
  });

  it("with enough credits → 200", async () => {
    const res = await request(app)
      .post("/api/payment/spend-credit")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ actionType: "credits_topic" });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  it("already owned same feature → 409", async () => {
    const res = await request(app)
      .post("/api/payment/spend-credit")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ actionType: "credits_topic" });
    expect(res.status).toBe(409);
    expect(res.body.code).toBe("ALREADY_OWNED");
  });

  it("insufficient credits → 402", async () => {
    await setCredits(userId, 0);
    const res = await request(app)
      .post("/api/payment/spend-credit")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ actionType: "credits_reply" });
    expect(res.status).toBe(402);
    expect(res.body.code).toBe("INSUFFICIENT_CREDITS");
  });

  it("invalid actionType → 400", async () => {
    const res = await request(app)
      .post("/api/payment/spend-credit")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ actionType: "invalid_action" });
    expect(res.status).toBe(400);
  });
});

// ── My Features ───────────────────────────────────────────────────────────────
describe("GET /api/payment/my-features", () => {
  it("→ 200 array", async () => {
    const res = await request(app)
      .get("/api/payment/my-features")
      .set("Authorization", `Bearer ${userToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

// ── Checkout ──────────────────────────────────────────────────────────────────
describe("POST /api/payment/checkout", () => {
  it("missing productType → 400", async () => {
    const res = await request(app)
      .post("/api/payment/checkout")
      .set("Authorization", `Bearer ${userToken}`)
      .send({});
    expect(res.status).toBe(400);
  });

  it("unconfigured priceId → 400", async () => {
    const res = await request(app)
      .post("/api/payment/checkout")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ productType: "nonexistent_product" });
    expect(res.status).toBe(400);
  });
});

// ── Admin Dashboard ───────────────────────────────────────────────────────────
describe("GET /api/admin/dashboard", () => {
  it("as admin → 200 { stats: {...} }", async () => {
    const res = await request(app)
      .get("/api/admin/dashboard")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.stats).toBeDefined();
    expect(typeof res.body.stats.totalUsers).toBe("number");
  });

  it("AD-02/SEC-03: as normal user → 403", async () => {
    const res = await request(app)
      .get("/api/admin/dashboard")
      .set("Authorization", `Bearer ${userToken}`);
    expect(res.status).toBe(403);
  });

  it("no auth → 401", async () => {
    const res = await request(app).get("/api/admin/dashboard");
    expect(res.status).toBe(401);
  });
});

// ── Admin Users ───────────────────────────────────────────────────────────────
describe("GET /api/admin/users", () => {
  it("AD-08: as admin → 200 array", async () => {
    const res = await request(app)
      .get("/api/admin/users")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("AD-09: as admin with search filter → filtered results", async () => {
    const res = await request(app)
      .get("/api/admin/users?search=premium_admin")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("as normal user → 403", async () => {
    const res = await request(app)
      .get("/api/admin/users")
      .set("Authorization", `Bearer ${userToken}`);
    expect(res.status).toBe(403);
  });
});

// ── Admin Update Role ─────────────────────────────────────────────────────────
describe("PATCH /api/admin/users/:id/role", () => {
  let targetUserId: string;

  beforeAll(async () => {
    // Create a target user to update role on
    const res = await request(app).post("/api/auth/register").send({
      email: "role_target@test.com",
      password: "targetpass123",
      displayName: "RoleTarget",
      userType: "emigrant",
    });
    targetUserId = res.body.user.id;
  });

  it("AD-10: {role: 'moderator'} as admin → 200", async () => {
    const res = await request(app)
      .patch(`/api/admin/users/${targetUserId}/role`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ role: "moderator" });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  it("AD-11: {role: 'superadmin'} as admin → 400", async () => {
    const res = await request(app)
      .patch(`/api/admin/users/${targetUserId}/role`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ role: "superadmin" });
    expect(res.status).toBe(400);
  });
});
