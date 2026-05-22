/**
 * Integration Testleri — NTF-EVT-004: Yorum bildirimi başlık ayrımı
 *
 * Konu sahibi yorum aldığında: "Konunuza yeni yorum geldi"
 * Konuya abone olan diğer kullanıcılar: "Takip ettiğin konuya yeni yorum"
 * Yorumu yazan kullanıcı: kendi yorumu için bildirim almaz
 */

import request from "supertest";
import { createApp } from "../../src/app";
import { closeDbConnection, resetDbConnection, getCollections } from "../../src/repositories/mongodb/db";
import type { Express } from "express";

let app: Express;
let ownerToken: string;
let ownerId: string;
let subscriberToken: string;
let commenterToken: string;
let adminToken: string;
let topicId: string;

async function makeAdmin(email: string) {
  const { users } = await getCollections();
  await users.updateOne({ email }, { $set: { role: "admin" } });
}

async function makePremium(uid: string) {
  const { users } = await getCollections();
  const until = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  await users.updateOne({ _id: uid }, { $set: { isPremium: true, premiumUntil: until } });
}

async function getNotifications(token: string): Promise<any[]> {
  const res = await request(app)
    .get("/api/notifications")
    .set("Authorization", `Bearer ${token}`);
  return res.body ?? [];
}

beforeAll(async () => {
  resetDbConnection();
  app = createApp({ skipRateLimit: true });
  await request(app).get("/api/health");

  // Konu sahibi (premium)
  const ownerRes = await request(app).post("/api/auth/register").send({
    email: "ntf004_owner@test.com",
    password: "ownerpass123",
    displayName: "KonuSahibi",
    userType: "emigrant",
  });
  ownerToken = ownerRes.body.token;
  ownerId = ownerRes.body.user.id;
  await makePremium(ownerId);

  // Admin
  await request(app).post("/api/auth/register").send({
    email: "ntf004_admin@test.com",
    password: "adminpass123",
    displayName: "Admin",
    userType: "emigrant",
  });
  await makeAdmin("ntf004_admin@test.com");
  const adminLogin = await request(app).post("/api/auth/login").send({
    email: "ntf004_admin@test.com",
    password: "adminpass123",
  });
  adminToken = adminLogin.body.token;

  // Abone (topic subscriber)
  const subRes = await request(app).post("/api/auth/register").send({
    email: "ntf004_sub@test.com",
    password: "subpass123",
    displayName: "Abone",
    userType: "emigrant",
  });
  subscriberToken = subRes.body.token;

  // Yorumcu
  const commenterRes = await request(app).post("/api/auth/register").send({
    email: "ntf004_commenter@test.com",
    password: "commentpass123",
    displayName: "Yorumcu",
    userType: "emigrant",
  });
  commenterToken = commenterRes.body.token;

  // Ülke + kategori oluştur
  const countryRes = await request(app)
    .post("/api/forum/countries")
    .set("Authorization", `Bearer ${adminToken}`)
    .send({ name: "NTF004 Ülke", code: "N4" });
  const countryId = countryRes.body.id ?? countryRes.body._id;

  const catRes = await request(app)
    .post("/api/forum/categories")
    .set("Authorization", `Bearer ${adminToken}`)
    .send({ countryId, name: "NTF004 Kategori" });
  const categoryId = catRes.body.id ?? catRes.body._id;

  // Konu oluştur (sahibi = owner)
  const topicRes = await request(app)
    .post("/api/forum/topics")
    .set("Authorization", `Bearer ${ownerToken}`)
    .send({ categoryId, title: "NTF004 Test Konusu Başlığı", content: "İçerik" });
  topicId = topicRes.body.id ?? topicRes.body._id;

  // Admin onaylar
  await request(app)
    .patch(`/api/admin/forum/topics/${topicId}/status`)
    .set("Authorization", `Bearer ${adminToken}`)
    .send({ status: "approved" });

  // Abone konuya abone olur
  await request(app)
    .post(`/api/forum/topics/${topicId}/subscribe`)
    .set("Authorization", `Bearer ${subscriberToken}`);
});

afterAll(async () => {
  await closeDbConnection();
});

// ── NTF-EVT-004: Konu sahibi vs abone bildirim başlığı ──────────────────────

describe("NTF-EVT-004 — Yorum bildirimi başlık ayrımı", () => {
  beforeAll(async () => {
    // Yorumcu yorum yazar
    await request(app)
      .post(`/api/forum/topics/${topicId}/comments`)
      .set("Authorization", `Bearer ${commenterToken}`)
      .send({ content: "Bu harika bir konu!" });

    // Async fan-out için bekle
    await new Promise((r) => setTimeout(r, 300));
  });

  it("NTF-004-01: konu sahibi → 'Konunuza yeni yorum geldi' alır", async () => {
    const notifs = await getNotifications(ownerToken);
    const commentNotif = notifs.find(
      (n: any) => n.type === "new_comment" && n.targetId === topicId
    );
    expect(commentNotif).toBeDefined();
    expect(commentNotif.title).toBe("Konunuza yeni yorum geldi");
  });

  it("NTF-004-02: abone kullanıcı → 'Takip ettiğin konuya yeni yorum' alır", async () => {
    const notifs = await getNotifications(subscriberToken);
    const commentNotif = notifs.find(
      (n: any) => n.type === "new_comment" && n.targetId === topicId
    );
    expect(commentNotif).toBeDefined();
    expect(commentNotif.title).toBe("Takip ettiğin konuya yeni yorum");
  });

  it("NTF-004-03: yorumcu kendi yorumu için bildirim almaz", async () => {
    const notifs = await getNotifications(commenterToken);
    const selfNotif = notifs.find(
      (n: any) => n.type === "new_comment" && n.targetId === topicId
    );
    expect(selfNotif).toBeUndefined();
  });

  it("NTF-004-04: owner başlığı aboneyle aynı değil (başlıklar farklı)", async () => {
    const ownerNotifs = await getNotifications(ownerToken);
    const subNotifs = await getNotifications(subscriberToken);

    const ownerCommentNotif = ownerNotifs.find(
      (n: any) => n.type === "new_comment" && n.targetId === topicId
    );
    const subCommentNotif = subNotifs.find(
      (n: any) => n.type === "new_comment" && n.targetId === topicId
    );

    expect(ownerCommentNotif?.title).not.toBe(subCommentNotif?.title);
  });

  it("NTF-004-05: bildirimde yorumcunun adı mesajda geçer", async () => {
    const notifs = await getNotifications(ownerToken);
    const commentNotif = notifs.find(
      (n: any) => n.type === "new_comment" && n.targetId === topicId
    );
    expect(commentNotif?.message).toContain("Yorumcu");
  });
});

// ── Konu sahibi de abone ise sahibi önceliği geçerli ────────────────────────

describe("NTF-EVT-004 — Sahip + abone çakışması", () => {
  it("NTF-004-06: konu sahibi konuya abone olsa da 'Konunuza yeni yorum geldi' alır", async () => {
    // Sahip kendi konusuna abone olur
    await request(app)
      .post(`/api/forum/topics/${topicId}/subscribe`)
      .set("Authorization", `Bearer ${ownerToken}`);

    // İkinci yorum
    await request(app)
      .post(`/api/forum/topics/${topicId}/comments`)
      .set("Authorization", `Bearer ${commenterToken}`)
      .send({ content: "İkinci yorum — abone+sahip testi" });

    await new Promise((r) => setTimeout(r, 300));

    const notifs = await getNotifications(ownerToken);
    const ownerCommentNotifs = notifs.filter(
      (n: any) => n.type === "new_comment" && n.targetId === topicId
    );
    // Sahip başlığı yanlış olan bildirim olmamalı
    const wrongTitleNotif = ownerCommentNotifs.find(
      (n: any) => n.title !== "Konunuza yeni yorum geldi"
    );
    expect(wrongTitleNotif).toBeUndefined();
  });
});
