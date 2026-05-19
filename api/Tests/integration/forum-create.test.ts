import request from "supertest";
import { createApp } from "../../src/app";
import { closeDbConnection, resetDbConnection, getCollections } from "../../src/repositories/mongodb/db";
import type { Express } from "express";

let app: Express;
let userToken: string;
let userId: string;
let premiumToken: string;
let premiumId: string;
let adminToken: string;
let adminId: string;
let countryId: string;
let categoryId: string;

async function makeAdmin(email: string) {
  const { users } = await getCollections();
  await users.updateOne({ email }, { $set: { role: "admin" } });
}

async function makePremium(uid: string) {
  const { users } = await getCollections();
  const until = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  await users.updateOne({ _id: uid }, { $set: { isPremium: true, premiumUntil: until } });
}

async function setCredits(uid: string, amount: number) {
  const { users } = await getCollections();
  await users.updateOne({ _id: uid }, { $set: { credits: amount } });
}

async function getCredits(uid: string): Promise<number> {
  const { users } = await getCollections();
  const u = await users.findOne({ _id: uid });
  return (u?.credits as number) ?? 0;
}

beforeAll(async () => {
  resetDbConnection();
  app = createApp({ skipRateLimit: true });
  await request(app).get("/api/health");

  const userRes = await request(app).post("/api/auth/register").send({
    email: "tpc002_user@test.com",
    password: "pass12345",
    displayName: "UserTPC",
    userType: "emigrant",
  });
  userToken = userRes.body.token;
  userId = userRes.body.user.id;

  const premRes = await request(app).post("/api/auth/register").send({
    email: "tpc002_prem@test.com",
    password: "pass12345",
    displayName: "PremTPC",
    userType: "emigrant",
  });
  premiumId = premRes.body.user.id;
  await makePremium(premiumId);
  const premLogin = await request(app).post("/api/auth/login").send({
    email: "tpc002_prem@test.com",
    password: "pass12345",
  });
  premiumToken = premLogin.body.token;

  const adminRes = await request(app).post("/api/auth/register").send({
    email: "tpc002_admin@test.com",
    password: "pass12345",
    displayName: "AdminTPC",
    userType: "emigrant",
  });
  adminId = adminRes.body.user.id;
  await makeAdmin("tpc002_admin@test.com");
  const adminLogin = await request(app).post("/api/auth/login").send({
    email: "tpc002_admin@test.com",
    password: "pass12345",
  });
  adminToken = adminLogin.body.token;

  const countryRes = await request(app)
    .post("/api/forum/countries")
    .set("Authorization", `Bearer ${adminToken}`)
    .send({ name: "TPC002 Country", code: "TP" });
  countryId = countryRes.body.id || countryRes.body._id;

  const catRes = await request(app)
    .post("/api/forum/categories")
    .set("Authorization", `Bearer ${adminToken}`)
    .send({ countryId, name: "TPC002 Cat" });
  categoryId = catRes.body.id || catRes.body._id;
});

afterAll(async () => {
  await closeDbConnection();
});

describe("FRM-TPC-002 POST /forum/topics — uçtan uca", () => {
  it("TPC002-01: normal user yeterli kredi → 200 pending, kredi düşmüş", async () => {
    await setCredits(userId, 200);
    const before = await getCredits(userId);

    const res = await request(app)
      .post("/api/forum/topics")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ categoryId, title: "Pending TPC002 başlık", content: "detay" });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("pending");

    const after = await getCredits(userId);
    expect(after).toBeLessThan(before);
  });

  it("TPC002-02: pending konu sonrası user 'Konunuz alındı' notification almış olmalı", async () => {
    await setCredits(userId, 200);
    const title = "TPC002 notify edilen başlık";
    const createRes = await request(app)
      .post("/api/forum/topics")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ categoryId, title });
    expect(createRes.status).toBe(200);

    // notifications fan-out is fire-and-forget — wait a tick
    await new Promise((r) => setTimeout(r, 200));

    const notifRes = await request(app)
      .get("/api/notifications")
      .set("Authorization", `Bearer ${userToken}`);
    expect(notifRes.status).toBe(200);
    const list = notifRes.body as Array<{ type: string; title: string; targetId?: string }>;
    const found = list.find(
      (n) => n.type === "system" && n.title.includes("Konunuz alındı") && n.targetId === createRes.body.id
    );
    expect(found).toBeDefined();
  });

  it("TPC002-03: pending konu sonrası admin 'admin_new_pending' notification almalı", async () => {
    await setCredits(userId, 200);
    const title = "TPC002 admin notify";
    const createRes = await request(app)
      .post("/api/forum/topics")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ categoryId, title });
    expect(createRes.status).toBe(200);

    await new Promise((r) => setTimeout(r, 300));

    const notifRes = await request(app)
      .get("/api/notifications")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(notifRes.status).toBe(200);
    const list = notifRes.body as Array<{ type: string; targetId?: string }>;
    const found = list.find((n) => n.type === "admin_new_pending" && n.targetId === createRes.body.id);
    expect(found).toBeDefined();
  });

  it("TPC002-04: premium user → 200 pending, kredi DÜŞMEMELİ", async () => {
    await setCredits(premiumId, 100);
    const before = await getCredits(premiumId);
    const res = await request(app)
      .post("/api/forum/topics")
      .set("Authorization", `Bearer ${premiumToken}`)
      .send({ categoryId, title: "Premium TPC002 konusu" });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("pending");
    const after = await getCredits(premiumId);
    expect(after).toBe(before);
  });

  it("TPC002-05: admin → 200 approved", async () => {
    const res = await request(app)
      .post("/api/forum/topics")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ categoryId, title: "Admin TPC002 başlık" });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("approved");
  });

  it("TPC002-06: 0 kredi → 402 INSUFFICIENT_CREDITS", async () => {
    await setCredits(userId, 0);
    const res = await request(app)
      .post("/api/forum/topics")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ categoryId, title: "Krediyok TPC002" });
    expect(res.status).toBe(402);
    expect(res.body.code).toBe("INSUFFICIENT_CREDITS");
  });

  it("TPC002-07: SSE /admin/topics/stream — yeni pending konu broadcast edilir", async () => {
    // Open SSE stream as admin (via token query param)
    const received: string[] = [];
    const httpModule = await import("http");
    const addr = app.listen(0).address();
    const port = typeof addr === "object" && addr ? addr.port : 0;

    await new Promise<void>((resolve, reject) => {
      const req = httpModule.request(
        {
          hostname: "127.0.0.1",
          port,
          path: `/api/admin/topics/stream?token=${adminToken}`,
          method: "GET",
          headers: { Accept: "text/event-stream" },
        },
        (res) => {
          res.setEncoding("utf8");
          res.on("data", (chunk: string) => {
            received.push(chunk);
            if (received.join("").includes("new_pending")) resolve();
          });
        }
      );
      req.on("error", reject);
      req.end();
      // After connection is open, trigger a pending topic
      setTimeout(async () => {
        await setCredits(userId, 200);
        await request(app)
          .post("/api/forum/topics")
          .set("Authorization", `Bearer ${userToken}`)
          .send({ categoryId, title: "SSE TPC002 broadcast başlığı" });
      }, 250);
      // Safety timeout
      setTimeout(() => reject(new Error("SSE timeout — broadcastPendingTopic muhtemelen çağrılmadı")), 5000);
    });

    expect(received.join("")).toMatch(/new_pending/);
  }, 10000);
});
