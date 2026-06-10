/**
 * Integration Testleri — Premium Abonelik Değişiklikleri
 *
 * Kapsam:
 *  - POST /payment/process: subscription planı satın alınca premiumUntil override (stack etme)
 *  - POST /payment/process: autoRenew set edilmeli
 *  - POST /payment/process: aynı plan + autoRenew=false olan kullanıcı autoRenew=true ile tekrar alabilmeli
 *  - POST /payment/process: non-subscription plan → duplicate ownership 409 ALREADY_OWNED
 *  - POST /payment/cancel: isPremium=false, premiumUntil=undefined, feature keyleri silinmeli
 *  - MongoUserRepository.update(): undefined değerleri $unset, tanımlı değerleri $set ile işlemeli
 *  - GET /users/me: süresi geçmiş isPremium → otomatik reset
 */

import request from "supertest";
import { createApp } from "../../src/app";
import { closeDbConnection, resetDbConnection, getCollections } from "../../src/repositories/mongodb/db";
import type { Express } from "express";

let app: Express;
let adminToken: string;
let userToken: string;
let userId: string;
let subPlanId: string;
let nonSubPlanId: string;

async function makeAdmin(email: string) {
  const { users } = await getCollections();
  await users.updateOne({ email }, { $set: { role: "admin" } });
}

beforeAll(async () => {
  resetDbConnection();
  app = createApp({ skipRateLimit: true });
  await request(app).get("/api/health");

  // Admin kullanıcı
  await request(app).post("/api/auth/register").send({
    email: "prmsub_admin@test.com",
    password: "adminpass123",
    displayName: "PrmSubAdmin",
    userType: "emigrant",
  });
  await makeAdmin("prmsub_admin@test.com");
  const adminLogin = await request(app).post("/api/auth/login").send({
    email: "prmsub_admin@test.com",
    password: "adminpass123",
  });
  adminToken = adminLogin.body.token;

  // Normal kullanıcı
  const userRes = await request(app).post("/api/auth/register").send({
    email: "prmsub_user@test.com",
    password: "userpass123",
    displayName: "PrmSubUser",
    userType: "emigrant",
  });
  userToken = userRes.body.token;
  userId = userRes.body.user.id;

  // Subscription plan oluştur
  const subRes = await request(app)
    .post("/api/admin/premium/plans")
    .set("Authorization", `Bearer ${adminToken}`)
    .send({
      name: "PrmSub Haftalık Abonelik",
      price: 99,
      durationDays: 7,
      featureKeys: ["unlimited_topics", "unlimited_comments_weekly"],
      isSubscription: true,
      subscriptionDiscountPercent: 20,
      isActive: true,
    });
  subPlanId = subRes.body.id;

  // Non-subscription plan oluştur
  const nonSubRes = await request(app)
    .post("/api/admin/premium/plans")
    .set("Authorization", `Bearer ${adminToken}`)
    .send({
      name: "PrmSub Tek Seferlik Paket",
      price: 49,
      durationDays: 30,
      featureKeys: ["prmsub_test_feature"],
      isSubscription: false,
      isActive: true,
    });
  nonSubPlanId = nonSubRes.body.id;
});

afterAll(async () => {
  await closeDbConnection();
});

// ─── POST /payment/process — Subscription plan alımı ────────────────────────

describe("POST /payment/process — subscription plan", () => {
  it("PRM-SUB-01: subscription plan alınınca isPremium=true ve premiumUntil set edilir", async () => {
    const res = await request(app)
      .post("/api/payment/process")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ productType: subPlanId, autoRenew: false });

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.isPremium).toBe(true);
    expect(res.body.premiumUntil).toBeTruthy();
  });

  it("PRM-SUB-02: subscription plan tekrar alınınca premiumUntil stack edilmez, override edilir", async () => {
    // İlk alım
    const first = await request(app)
      .post("/api/payment/process")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ productType: subPlanId, autoRenew: false });
    const firstUntil = new Date(first.body.premiumUntil).getTime();

    // 10ms bekle (zaman farkı için)
    await new Promise((r) => setTimeout(r, 10));

    // İkinci alım — süre stack edilmemeli, şu andan itibaren yeniden hesaplanmalı
    const second = await request(app)
      .post("/api/payment/process")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ productType: subPlanId, autoRenew: false });
    const secondUntil = new Date(second.body.premiumUntil).getTime();

    expect(second.status).toBe(200);
    // İkinci alım bitiş tarihi birinciden farklı (override, stack değil)
    // Eğer stack olsaydı 14 gün sonra olurdu; override ile ~7 gün sonra
    const diffDays = (secondUntil - firstUntil) / (86_400_000);
    expect(diffDays).toBeLessThan(1); // Stack olsaydı ~7 gün fark olurdu
  });

  it("PRM-SUB-03: autoRenew=true gönderilince response'da autoRenew=true döner", async () => {
    const res = await request(app)
      .post("/api/payment/process")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ productType: subPlanId, autoRenew: true });

    expect(res.status).toBe(200);
    expect(res.body.autoRenew).toBe(true);
  });

  it("PRM-SUB-04: autoRenew=false gönderilince response'da autoRenew=false döner", async () => {
    const res = await request(app)
      .post("/api/payment/process")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ productType: subPlanId, autoRenew: false });

    expect(res.status).toBe(200);
    expect(res.body.autoRenew).toBe(false);
  });

  it("PRM-SUB-05: aynı plan + autoRenew=false iken autoRenew=true ile tekrar alım → 200 (engellenmemeli)", async () => {
    // Önce autoRenew=false ile al
    await request(app)
      .post("/api/payment/process")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ productType: subPlanId, autoRenew: false });

    // Ardından aynı plan autoRenew=true ile tekrar al
    const res = await request(app)
      .post("/api/payment/process")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ productType: subPlanId, autoRenew: true });

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.autoRenew).toBe(true);
  });

  it("PRM-SUB-06: subscription planı non-subscription gibi 409 vermemeli", async () => {
    // İki kez al
    await request(app)
      .post("/api/payment/process")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ productType: subPlanId });

    const res = await request(app)
      .post("/api/payment/process")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ productType: subPlanId });

    expect(res.status).toBe(200); // 409 olmamalı
  });
});

// ─── POST /payment/process — Non-subscription duplicate ownership ────────────

describe("POST /payment/process — non-subscription duplicate ownership", () => {
  let user2Token: string;

  beforeAll(async () => {
    const u2 = await request(app).post("/api/auth/register").send({
      email: "prmsub_user2@test.com",
      password: "userpass123",
      displayName: "PrmSubUser2",
      userType: "emigrant",
    });
    user2Token = u2.body.token;
  });

  it("PRM-DUP-01: non-subscription planı ilk kez alınca → 200", async () => {
    const res = await request(app)
      .post("/api/payment/process")
      .set("Authorization", `Bearer ${user2Token}`)
      .send({ productType: nonSubPlanId });

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  it("PRM-DUP-02: non-subscription planı ikinci kez alınca → 409 ALREADY_OWNED", async () => {
    const res = await request(app)
      .post("/api/payment/process")
      .set("Authorization", `Bearer ${user2Token}`)
      .send({ productType: nonSubPlanId });

    expect(res.status).toBe(409);
    expect(res.body.code).toBe("ALREADY_OWNED");
  });
});

// ─── POST /payment/cancel ────────────────────────────────────────────────────

describe("POST /payment/cancel", () => {
  let cancelUserToken: string;

  beforeAll(async () => {
    const u = await request(app).post("/api/auth/register").send({
      email: "prmsub_cancel@test.com",
      password: "cancelpass123",
      displayName: "PrmSubCancel",
      userType: "emigrant",
    });
    cancelUserToken = u.body.token;
  });

  it("PRM-CAN-01: premium olmayan kullanıcı iptal → 400 NOT_PREMIUM", async () => {
    const res = await request(app)
      .post("/api/payment/cancel")
      .set("Authorization", `Bearer ${cancelUserToken}`);

    expect(res.status).toBe(400);
    expect(res.body.code).toBe("NOT_PREMIUM");
  });

  it("PRM-CAN-02: subscription alındıktan sonra iptal → 200 ve isPremium=false", async () => {
    // Önce subscription satın al
    await request(app)
      .post("/api/payment/process")
      .set("Authorization", `Bearer ${cancelUserToken}`)
      .send({ productType: subPlanId, autoRenew: true });

    // İptal et
    const cancelRes = await request(app)
      .post("/api/payment/cancel")
      .set("Authorization", `Bearer ${cancelUserToken}`);

    expect(cancelRes.status).toBe(200);
    expect(cancelRes.body.ok).toBe(true);
  });

  it("PRM-CAN-03: iptal sonrası /users/me → isPremium=false, premiumUntil=null, autoRenew=false", async () => {
    // Satın al
    await request(app)
      .post("/api/payment/process")
      .set("Authorization", `Bearer ${cancelUserToken}`)
      .send({ productType: subPlanId, autoRenew: true });

    // İptal et
    await request(app)
      .post("/api/payment/cancel")
      .set("Authorization", `Bearer ${cancelUserToken}`);

    // Kullanıcı bilgisini kontrol et
    const meRes = await request(app)
      .get("/api/users/me")
      .set("Authorization", `Bearer ${cancelUserToken}`);

    expect(meRes.status).toBe(200);
    expect(meRes.body.isPremium).toBe(false);
    expect(meRes.body.premiumUntil == null).toBe(true); // null veya undefined
    expect(meRes.body.autoRenew).toBe(false);
  });

  it("PRM-CAN-04: iptal sonrası tekrar iptal → 400 NOT_PREMIUM", async () => {
    // Satın al
    await request(app)
      .post("/api/payment/process")
      .set("Authorization", `Bearer ${cancelUserToken}`)
      .send({ productType: subPlanId });

    // İlk iptal
    await request(app)
      .post("/api/payment/cancel")
      .set("Authorization", `Bearer ${cancelUserToken}`);

    // İkinci iptal — premium yok
    const res = await request(app)
      .post("/api/payment/cancel")
      .set("Authorization", `Bearer ${cancelUserToken}`);

    expect(res.status).toBe(400);
    expect(res.body.code).toBe("NOT_PREMIUM");
  });
});

// ─── GET /users/me — süresi geçmiş premium otomatik reset ────────────────────

describe("GET /users/me — süresi geçmiş premium otomatik reset", () => {
  let expiredUserToken: string;

  beforeAll(async () => {
    const u = await request(app).post("/api/auth/register").send({
      email: "prmsub_expired@test.com",
      password: "expiredpass123",
      displayName: "PrmSubExpired",
      userType: "emigrant",
    });
    expiredUserToken = u.body.token;
  });

  it("PRM-EXP-01: isPremium=true ama premiumUntil geçmişte → /users/me sonrası isPremium=false döner", async () => {
    // DB'de doğrudan geçmiş tarihli premium set et
    const { users } = await getCollections();
    const pastDate = new Date(Date.now() - 86_400_000).toISOString(); // dün
    await users.updateOne(
      { email: "prmsub_expired@test.com" },
      { $set: { isPremium: true, premiumUntil: pastDate, autoRenew: true } }
    );

    const meRes = await request(app)
      .get("/api/users/me")
      .set("Authorization", `Bearer ${expiredUserToken}`);

    expect(meRes.status).toBe(200);
    expect(meRes.body.isPremium).toBe(false);
    expect(meRes.body.autoRenew).toBe(false);
    // premiumUntil undefined veya null olmalı
    expect(meRes.body.premiumUntil == null).toBe(true);
  });

  it("PRM-EXP-02: premiumUntil gelecekte olan kullanıcı reset edilmemeli", async () => {
    const { users } = await getCollections();
    const futureDate = new Date(Date.now() + 7 * 86_400_000).toISOString();
    await users.updateOne(
      { email: "prmsub_expired@test.com" },
      { $set: { isPremium: true, premiumUntil: futureDate, autoRenew: true } }
    );

    const meRes = await request(app)
      .get("/api/users/me")
      .set("Authorization", `Bearer ${expiredUserToken}`);

    expect(meRes.status).toBe(200);
    expect(meRes.body.isPremium).toBe(true);
    expect(meRes.body.premiumUntil).toBe(futureDate);
  });
});

// ─── MongoUserRepository.update() — $set ve $unset davranışı ─────────────────

describe("MongoUserRepository.update() — $set ve $unset", () => {
  let repoUserToken: string;
  let repoUserId: string;

  beforeAll(async () => {
    const u = await request(app).post("/api/auth/register").send({
      email: "prmsub_repo@test.com",
      password: "repopass123",
      displayName: "PrmSubRepo",
      userType: "emigrant",
    });
    repoUserToken = u.body.token;
    repoUserId = u.body.user.id;
  });

  it("PRM-REPO-01: update() ile tanımlı field set edilir", async () => {
    // Premium satın al — repository update() çağrılır
    const res = await request(app)
      .post("/api/payment/process")
      .set("Authorization", `Bearer ${repoUserToken}`)
      .send({ productType: subPlanId, autoRenew: true });

    expect(res.status).toBe(200);

    // DB'den doğrudan oku
    const { users } = await getCollections();
    const doc = await users.findOne({ _id: repoUserId });
    expect(doc?.isPremium).toBe(true);
    expect(doc?.autoRenew).toBe(true);
    expect(doc?.premiumUntil).toBeTruthy();
  });

  it("PRM-REPO-02: update() ile undefined field $unset ile kaldırılır", async () => {
    // Önce premium al
    await request(app)
      .post("/api/payment/process")
      .set("Authorization", `Bearer ${repoUserToken}`)
      .send({ productType: subPlanId, autoRenew: true });

    // İptal et — premiumUntil: undefined gönderilir, $unset ile silinmeli
    await request(app)
      .post("/api/payment/cancel")
      .set("Authorization", `Bearer ${repoUserToken}`);

    // DB'den doğrudan oku
    const { users } = await getCollections();
    const doc = await users.findOne({ _id: repoUserId });
    expect(doc?.isPremium).toBe(false);
    // premiumUntil field'ı ya silinmiş ya da undefined olmalı
    expect(doc?.premiumUntil).toBeUndefined();
  });

  it("PRM-REPO-03: update() hem set hem unset aynı anda çalışabilir", async () => {
    // Önce tüm premium alanları set et
    await request(app)
      .post("/api/payment/process")
      .set("Authorization", `Bearer ${repoUserToken}`)
      .send({ productType: subPlanId, autoRenew: true });

    // İptal — isPremium=false SET, premiumUntil UNSET, autoRenew=false SET aynı anda
    const cancelRes = await request(app)
      .post("/api/payment/cancel")
      .set("Authorization", `Bearer ${repoUserToken}`);

    expect(cancelRes.status).toBe(200);

    const { users } = await getCollections();
    const doc = await users.findOne({ _id: repoUserId });
    // SET: isPremium=false, autoRenew=false
    expect(doc?.isPremium).toBe(false);
    expect(doc?.autoRenew).toBe(false);
    // UNSET: premiumUntil kaldırılmış
    expect(doc?.premiumUntil).toBeUndefined();
  });
});
