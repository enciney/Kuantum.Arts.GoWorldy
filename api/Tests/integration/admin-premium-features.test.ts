import request from "supertest";
import { createApp } from "../../src/app";
import { closeDbConnection, resetDbConnection, getCollections } from "../../src/repositories/mongodb/db";
import type { Express } from "express";

let app: Express;
let adminToken: string;
let userToken: string;

async function makeAdmin(email: string) {
  const { users } = await getCollections();
  await users.updateOne({ email }, { $set: { role: "admin" } });
}

beforeAll(async () => {
  resetDbConnection();
  app = createApp({ skipRateLimit: true });
  await request(app).get("/api/health");

  const userRes = await request(app).post("/api/auth/register").send({
    email: "prmfst_user@test.com",
    password: "pass12345",
    displayName: "PrmFstUser",
    userType: "emigrant",
  });
  userToken = userRes.body.token;

  const adminRes = await request(app).post("/api/auth/register").send({
    email: "prmfst_admin@test.com",
    password: "pass12345",
    displayName: "PrmFstAdmin",
    userType: "emigrant",
  });
  await makeAdmin("prmfst_admin@test.com");
  const adminLogin = await request(app).post("/api/auth/login").send({
    email: "prmfst_admin@test.com",
    password: "pass12345",
  });
  adminToken = adminLogin.body.token;
});

afterAll(async () => {
  await closeDbConnection();
});

// ── PRM-FST-002: Main Feature Catalog ─────────────────────────────────────────
describe("GET /api/admin/premium/main-features", () => {
  it("admin → 200 array", async () => {
    const res = await request(app)
      .get("/api/admin/premium/main-features")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("normal user → 403", async () => {
    const res = await request(app)
      .get("/api/admin/premium/main-features")
      .set("Authorization", `Bearer ${userToken}`);
    expect(res.status).toBe(403);
  });

  it("auth yok → 401", async () => {
    const res = await request(app).get("/api/admin/premium/main-features");
    expect(res.status).toBe(401);
  });
});

describe("POST /api/admin/premium/main-features", () => {
  it("geçerli key + name → 201", async () => {
    const res = await request(app)
      .post("/api/admin/premium/main-features")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ key: "test_konu_acma", name: "Konu Açma Paketi", description: "Konu açma hakları", isActive: true });
    expect(res.status).toBe(201);
    expect(res.body.key).toBe("test_konu_acma");
    expect(res.body.name).toBe("Konu Açma Paketi");
    expect(res.body.id).toBeTruthy();
  });

  it("aynı key → 409", async () => {
    await request(app)
      .post("/api/admin/premium/main-features")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ key: "duplicate_mf_key", name: "İlk" });
    const res = await request(app)
      .post("/api/admin/premium/main-features")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ key: "duplicate_mf_key", name: "İkinci" });
    expect(res.status).toBe(409);
  });

  it("geçersiz key formatı (büyük harf) → 400", async () => {
    const res = await request(app)
      .post("/api/admin/premium/main-features")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ key: "GecersizKey", name: "Test" });
    expect(res.status).toBe(400);
  });

  it("key eksik → 400", async () => {
    const res = await request(app)
      .post("/api/admin/premium/main-features")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ name: "Key yok" });
    expect(res.status).toBe(400);
  });

  it("name eksik → 400", async () => {
    const res = await request(app)
      .post("/api/admin/premium/main-features")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ key: "name_yok_key" });
    expect(res.status).toBe(400);
  });

  it("normal user → 403", async () => {
    const res = await request(app)
      .post("/api/admin/premium/main-features")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ key: "yetki_yok", name: "Test" });
    expect(res.status).toBe(403);
  });
});

describe("PATCH /api/admin/premium/main-features/:id", () => {
  let mfId: string;

  beforeAll(async () => {
    const res = await request(app)
      .post("/api/admin/premium/main-features")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ key: "patch_mf_test", name: "Patch Test MF" });
    mfId = res.body.id;
  });

  it("geçerli güncelleme → 200 { ok: true }", async () => {
    const res = await request(app)
      .patch(`/api/admin/premium/main-features/${mfId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ name: "Güncellenmiş MF", isActive: false });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  it("geçersiz key formatı → 400", async () => {
    const res = await request(app)
      .patch(`/api/admin/premium/main-features/${mfId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ key: "INVALID_KEY" });
    expect(res.status).toBe(400);
  });

  it("normal user → 403", async () => {
    const res = await request(app)
      .patch(`/api/admin/premium/main-features/${mfId}`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({ name: "Yetkisiz" });
    expect(res.status).toBe(403);
  });
});

describe("DELETE /api/admin/premium/main-features/:id", () => {
  it("geçerli id → 200 { ok: true }", async () => {
    const create = await request(app)
      .post("/api/admin/premium/main-features")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ key: "delete_mf_test", name: "Silinecek MF" });
    const id = create.body.id;

    const res = await request(app)
      .delete(`/api/admin/premium/main-features/${id}`)
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  it("normal user → 403", async () => {
    const res = await request(app)
      .delete("/api/admin/premium/main-features/herhangi_id")
      .set("Authorization", `Bearer ${userToken}`);
    expect(res.status).toBe(403);
  });
});

// ── PRM-FST-001: Feature Catalog ──────────────────────────────────────────────
describe("GET /api/admin/premium/features", () => {
  it("admin → 200 array", async () => {
    const res = await request(app)
      .get("/api/admin/premium/features")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("normal user → 403", async () => {
    const res = await request(app)
      .get("/api/admin/premium/features")
      .set("Authorization", `Bearer ${userToken}`);
    expect(res.status).toBe(403);
  });
});

describe("POST /api/admin/premium/features", () => {
  let validMainFeatureId: string;

  beforeAll(async () => {
    const mf = await request(app)
      .post("/api/admin/premium/main-features")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ key: "mf_for_features", name: "Referans MF" });
    validMainFeatureId = mf.body.id;
  });

  it("geçerli key + name → 201", async () => {
    const res = await request(app)
      .post("/api/admin/premium/features")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        key: "forum_weekly_100",
        name: "Forum 100 Hak Haftalık",
        description: "7 günlük 100 forum hakkı",
        durationDays: 7,
        quota: 100,
        isActive: true,
      });
    expect(res.status).toBe(201);
    expect(res.body.key).toBe("forum_weekly_100");
    expect(res.body.id).toBeTruthy();
  });

  it("geçerli mainFeatureId ile → 201", async () => {
    const res = await request(app)
      .post("/api/admin/premium/features")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        key: "feature_with_main",
        name: "Ana Kategori Bağlı",
        mainFeatureId: validMainFeatureId,
        durationDays: 30,
      });
    expect(res.status).toBe(201);
    expect(res.body.mainFeatureId).toBe(validMainFeatureId);
  });

  it("geçersiz mainFeatureId → 400", async () => {
    const res = await request(app)
      .post("/api/admin/premium/features")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        key: "bad_main_feature",
        name: "Kötü MF",
        mainFeatureId: "000000000000000000000000",
      });
    expect(res.status).toBe(400);
  });

  it("aynı key → 409", async () => {
    await request(app)
      .post("/api/admin/premium/features")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ key: "dup_feature_key", name: "İlk" });
    const res = await request(app)
      .post("/api/admin/premium/features")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ key: "dup_feature_key", name: "İkinci" });
    expect(res.status).toBe(409);
  });

  it("geçersiz key formatı (boşluk içeren) → 400", async () => {
    const res = await request(app)
      .post("/api/admin/premium/features")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ key: "invalid key", name: "Test" });
    expect(res.status).toBe(400);
  });

  it("key eksik → 400", async () => {
    const res = await request(app)
      .post("/api/admin/premium/features")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ name: "Key yok" });
    expect(res.status).toBe(400);
  });

  it("normal user → 403", async () => {
    const res = await request(app)
      .post("/api/admin/premium/features")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ key: "yetki_yok_feature", name: "Test" });
    expect(res.status).toBe(403);
  });
});

describe("PATCH /api/admin/premium/features/:id", () => {
  let featureId: string;

  beforeAll(async () => {
    const res = await request(app)
      .post("/api/admin/premium/features")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ key: "patch_feature_test", name: "Patch Test Feature", durationDays: 7 });
    featureId = res.body.id;
  });

  it("geçerli güncelleme → 200 { ok: true }", async () => {
    const res = await request(app)
      .patch(`/api/admin/premium/features/${featureId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ name: "Güncellenmiş Feature", quota: 50, isActive: false });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  it("geçersiz key formatı → 400", async () => {
    const res = await request(app)
      .patch(`/api/admin/premium/features/${featureId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ key: "INVALID_KEY_FORMAT" });
    expect(res.status).toBe(400);
  });

  it("geçersiz mainFeatureId → 400", async () => {
    const res = await request(app)
      .patch(`/api/admin/premium/features/${featureId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ mainFeatureId: "000000000000000000000000" });
    expect(res.status).toBe(400);
  });

  it("normal user → 403", async () => {
    const res = await request(app)
      .patch(`/api/admin/premium/features/${featureId}`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({ name: "Yetkisiz" });
    expect(res.status).toBe(403);
  });
});

describe("DELETE /api/admin/premium/features/:id", () => {
  it("geçerli id → 200 { ok: true }", async () => {
    const create = await request(app)
      .post("/api/admin/premium/features")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ key: "delete_feature_test", name: "Silinecek Feature" });
    const id = create.body.id;

    const res = await request(app)
      .delete(`/api/admin/premium/features/${id}`)
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  it("normal user → 403", async () => {
    const res = await request(app)
      .delete("/api/admin/premium/features/herhangi_id")
      .set("Authorization", `Bearer ${userToken}`);
    expect(res.status).toBe(403);
  });
});

// ── Premium plan + isSubscription/featureKeys/subscriptionDiscountPercent ─────
describe("POST /api/admin/premium/plans — yeni alanlar", () => {
  it("featureKeys + isSubscription + subscriptionDiscountPercent ile plan oluşturulur → 201", async () => {
    const res = await request(app)
      .post("/api/admin/premium/plans")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        name: "Test Sub Plan",
        price: 299,
        durationDays: 30,
        features: ["Sınırsız forum"],
        featureKeys: ["forum_unlimited"],
        isSubscription: true,
        subscriptionDiscountPercent: 20,
        isActive: true,
      });
    expect(res.status).toBe(201);
    expect(res.body.isSubscription).toBe(true);
    expect(res.body.subscriptionDiscountPercent).toBe(20);
    expect(Array.isArray(res.body.featureKeys)).toBe(true);
    expect(res.body.featureKeys).toContain("forum_unlimited");
  });

  it("subscriptionDiscountPercent 101 → 400", async () => {
    const res = await request(app)
      .post("/api/admin/premium/plans")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        name: "Geçersiz İndirim",
        price: 100,
        durationDays: 7,
        subscriptionDiscountPercent: 101,
      });
    expect(res.status).toBe(400);
  });

  it("subscriptionDiscountPercent -1 → 400", async () => {
    const res = await request(app)
      .post("/api/admin/premium/plans")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        name: "Negatif İndirim",
        price: 100,
        durationDays: 7,
        subscriptionDiscountPercent: -1,
      });
    expect(res.status).toBe(400);
  });
});

describe("PATCH /api/admin/premium/plans/:id — yeni alanlar", () => {
  let planId: string;

  beforeAll(async () => {
    const res = await request(app)
      .post("/api/admin/premium/plans")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ name: "Patch Sub Plan", price: 199, durationDays: 7 });
    planId = res.body.id;
  });

  it("isSubscription + featureKeys + subscriptionDiscountPercent güncellenebilir", async () => {
    const res = await request(app)
      .patch(`/api/admin/premium/plans/${planId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        isSubscription: true,
        featureKeys: ["new_feature_key"],
        subscriptionDiscountPercent: 10,
      });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  it("subscriptionDiscountPercent 110 → 400", async () => {
    const res = await request(app)
      .patch(`/api/admin/premium/plans/${planId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ subscriptionDiscountPercent: 110 });
    expect(res.status).toBe(400);
  });
});
