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
  it("→ 200 { premium: [...] } (credits array artık yok)", async () => {
    const res = await request(app).get("/api/payment/packages");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.premium)).toBe(true);
    expect(res.body.credits).toBeUndefined();
  });

  it("premium paket alanları eksiksiz: description, isSubscription, subscriptionDiscountPercent", async () => {
    const res = await request(app).get("/api/payment/packages");
    expect(res.status).toBe(200);
    if (res.body.premium.length > 0) {
      const pkg = res.body.premium[0];
      expect(pkg).toHaveProperty("id");
      expect(pkg).toHaveProperty("name");
      expect(pkg).toHaveProperty("description");
      expect(pkg).toHaveProperty("days");
      expect(pkg).toHaveProperty("priceTL");
      expect(pkg).toHaveProperty("features");
      expect(pkg).toHaveProperty("isSubscription");
      expect(pkg).toHaveProperty("subscriptionDiscountPercent");
    }
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

  it("auth olmadan → 401", async () => {
    const res = await request(app).get("/api/payment/my-features");
    expect(res.status).toBe(401);
  });
});

// ── Process (mock ödeme) ──────────────────────────────────────────────────────
describe("POST /api/payment/process", () => {
  let subPlanId: string;
  let nonSubPlanId: string;

  beforeAll(async () => {
    // Subscription plan (haftalık, %15 indirimli)
    const subRes = await request(app)
      .post("/api/admin/premium/plans")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        name: "Test Haftalık",
        description: "Test",
        price: 199,
        durationDays: 7,
        features: ["Forum erişimi"],
        featureKeys: ["forum_access"],
        isSubscription: true,
        subscriptionDiscountPercent: 15,
        isActive: true,
      });
    subPlanId = subRes.body.id;

    // Tek seferlik plan (subscription değil)
    const nonSubRes = await request(app)
      .post("/api/admin/premium/plans")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        name: "Test Tek Seferlik",
        description: "Test",
        price: 99,
        durationDays: 30,
        features: ["Konu açma"],
        featureKeys: ["topic_create"],
        isSubscription: false,
        subscriptionDiscountPercent: 0,
        isActive: true,
      });
    nonSubPlanId = nonSubRes.body.id;
  });

  it("productType eksik → 400", async () => {
    const res = await request(app)
      .post("/api/payment/process")
      .set("Authorization", `Bearer ${userToken}`)
      .send({});
    expect(res.status).toBe(400);
  });

  it("geçersiz productType → 400", async () => {
    const res = await request(app)
      .post("/api/payment/process")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ productType: "olmayan_plan_id_xyz" });
    expect(res.status).toBe(400);
  });

  it("auth olmadan → 401", async () => {
    const res = await request(app)
      .post("/api/payment/process")
      .send({ productType: subPlanId });
    expect(res.status).toBe(401);
  });

  it("subscription plan → 200, isPremium=true, autoRenew=false (varsayılan)", async () => {
    const res = await request(app)
      .post("/api/payment/process")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ productType: subPlanId });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.isPremium).toBe(true);
    expect(res.body.premiumUntil).toBeTruthy();
    expect(res.body.autoRenew).toBe(false);
    expect(res.body.discountPct).toBe(0);
    expect(typeof res.body.chargedTL).toBe("number");
  });

  it("subscription plan + autoRenew=true → indirim uygulanır", async () => {
    // Yeni kullanıcı aç
    const newUser = await request(app).post("/api/auth/register").send({
      email: "process_autorenew@test.com",
      password: "pass12345",
      displayName: "AutoRenewUser",
      userType: "emigrant",
    });
    const token = newUser.body.token;

    const res = await request(app)
      .post("/api/payment/process")
      .set("Authorization", `Bearer ${token}`)
      .send({ productType: subPlanId, autoRenew: true });
    expect(res.status).toBe(200);
    expect(res.body.autoRenew).toBe(true);
    expect(res.body.discountPct).toBe(15);
    expect(res.body.chargedTL).toBeLessThan(199);
  });

  it("non-subscription plan → 200, isPremium değişmez", async () => {
    const newUser = await request(app).post("/api/auth/register").send({
      email: "process_nonsub@test.com",
      password: "pass12345",
      displayName: "NonSubUser",
      userType: "emigrant",
    });
    const token = newUser.body.token;

    const res = await request(app)
      .post("/api/payment/process")
      .set("Authorization", `Bearer ${token}`)
      .send({ productType: nonSubPlanId });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    // isPremium false kalmalı (isSubscription=false)
    expect(res.body.isPremium).toBe(false);
    expect(res.body.autoRenew).toBe(false);
    expect(res.body.discountPct).toBe(0);
  });

  it("featureKeys userFeatures'a yazılır (my-features endpoint doğrular)", async () => {
    const newUser = await request(app).post("/api/auth/register").send({
      email: "process_features@test.com",
      password: "pass12345",
      displayName: "FeaturesUser",
      userType: "emigrant",
    });
    const token = newUser.body.token;

    await request(app)
      .post("/api/payment/process")
      .set("Authorization", `Bearer ${token}`)
      .send({ productType: nonSubPlanId });

    const featRes = await request(app)
      .get("/api/payment/my-features")
      .set("Authorization", `Bearer ${token}`);
    expect(featRes.status).toBe(200);
    const keys = (featRes.body as Array<{ featureType: string }>).map((f) => f.featureType);
    expect(keys).toContain("topic_create");
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
