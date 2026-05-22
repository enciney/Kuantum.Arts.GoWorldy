/**
 * Integration Testleri — PAY-SPN-002: Zaten sahip olunan plan koruması
 *
 * Non-subscription (tek seferlik) bir plan iki kez satın alınmaya çalışılınca
 * 409 ALREADY_OWNED döndürmeli.
 * Subscription planlar için bu kısıtlama geçerli değil (yenilenebilir).
 */

import request from "supertest";
import { createApp } from "../../src/app";
import { closeDbConnection, resetDbConnection, getCollections } from "../../src/repositories/mongodb/db";
import type { Express } from "express";

let app: Express;
let adminToken: string;
let userToken: string;
let user2Token: string;
let nonSubPlanId: string;
let subPlanId: string;

async function makeAdmin(email: string) {
  const { users } = await getCollections();
  await users.updateOne({ email }, { $set: { role: "admin" } });
}

beforeAll(async () => {
  resetDbConnection();
  app = createApp({ skipRateLimit: true });
  await request(app).get("/api/health");

  // Admin
  await request(app).post("/api/auth/register").send({
    email: "spn002_admin@test.com",
    password: "adminpass123",
    displayName: "SPN002Admin",
    userType: "emigrant",
  });
  await makeAdmin("spn002_admin@test.com");
  const adminLogin = await request(app).post("/api/auth/login").send({
    email: "spn002_admin@test.com",
    password: "adminpass123",
  });
  adminToken = adminLogin.body.token;

  // User 1 (tekrar alım yapacak)
  const userRes = await request(app).post("/api/auth/register").send({
    email: "spn002_user@test.com",
    password: "userpass123",
    displayName: "SPN002User",
    userType: "emigrant",
  });
  userToken = userRes.body.token;

  // User 2 (bağımsız alım testi için)
  const user2Res = await request(app).post("/api/auth/register").send({
    email: "spn002_user2@test.com",
    password: "userpass123",
    displayName: "SPN002User2",
    userType: "emigrant",
  });
  user2Token = user2Res.body.token;

  // Non-subscription plan (featureKeys ile)
  const nonSubRes = await request(app)
    .post("/api/admin/premium/plans")
    .set("Authorization", `Bearer ${adminToken}`)
    .send({
      name: "SPN002 Test Tek Seferlik Paket",
      price: 49,
      durationDays: 30,
      featureKeys: ["spn002_test_feature"],
      isSubscription: false,
      isActive: true,
    });
  nonSubPlanId = nonSubRes.body.id;

  // Subscription plan
  const subRes = await request(app)
    .post("/api/admin/premium/plans")
    .set("Authorization", `Bearer ${adminToken}`)
    .send({
      name: "SPN002 Haftalık Abonelik",
      price: 99,
      durationDays: 7,
      isSubscription: true,
      isActive: true,
    });
  subPlanId = subRes.body.id;
});

afterAll(async () => {
  await closeDbConnection();
});

describe("PAY-SPN-002: Non-subscription plan tekrar alımı → 409", () => {
  it("SPN-01: non-subscription planın ilk alımı → 200 ok:true", async () => {
    const res = await request(app)
      .post("/api/payment/process")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ productType: nonSubPlanId });

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  it("SPN-02: aynı non-subscription planı ikinci kez alınca → 409 ALREADY_OWNED", async () => {
    const res = await request(app)
      .post("/api/payment/process")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ productType: nonSubPlanId });

    expect(res.status).toBe(409);
    expect(res.body.code).toBe("ALREADY_OWNED");
    expect(res.body.error).toBeTruthy();
  });

  it("SPN-03: farklı kullanıcı aynı planı ilk kez → 200 (409 yalnızca aynı user için)", async () => {
    const res = await request(app)
      .post("/api/payment/process")
      .set("Authorization", `Bearer ${user2Token}`)
      .send({ productType: nonSubPlanId });

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  it("SPN-04: subscription plan tekrar alımı → 409 DEĞİL (yenilenebilir)", async () => {
    // İlk alım
    await request(app)
      .post("/api/payment/process")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ productType: subPlanId });

    // İkinci alım — subscription planlar yenilenebilir, 409 olmamalı
    const res = await request(app)
      .post("/api/payment/process")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ productType: subPlanId });

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  it("SPN-05: subscription planın ikinci alımında premiumUntil uzar", async () => {
    const first = await request(app)
      .post("/api/payment/process")
      .set("Authorization", `Bearer ${user2Token}`)
      .send({ productType: subPlanId });
    const firstUntil = first.body.premiumUntil;

    const second = await request(app)
      .post("/api/payment/process")
      .set("Authorization", `Bearer ${user2Token}`)
      .send({ productType: subPlanId });
    const secondUntil = second.body.premiumUntil;

    expect(new Date(secondUntil).getTime()).toBeGreaterThan(new Date(firstUntil).getTime());
  });

  it("SPN-06: auth yok → 401", async () => {
    const res = await request(app)
      .post("/api/payment/process")
      .send({ productType: nonSubPlanId });

    expect(res.status).toBe(401);
  });

  it("SPN-07: geçersiz plan id → 400", async () => {
    const res = await request(app)
      .post("/api/payment/process")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ productType: "000000000000000000000000" });

    expect(res.status).toBe(400);
  });

  it("SPN-08: productType eksik → 400", async () => {
    const res = await request(app)
      .post("/api/payment/process")
      .set("Authorization", `Bearer ${userToken}`)
      .send({});

    expect(res.status).toBe(400);
  });
});
