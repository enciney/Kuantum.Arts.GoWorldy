/**
 * Integration Testleri — Konu Düzenleme & Silme Bildirimleri
 *
 * FRM-TPC-005: Konu sahibi edit-request gönderir → kendi bildirimi + staff bildirimi
 * FRM-TPC-005: Admin edit-request onaylar/reddeder → owner'a bildirim
 * FRM-TPC-006: Konu sahibi silme talebi gönderir → admin'e bildirim
 * Staff doğrudan topic günceller → owner'a bildirim
 */

import request from "supertest";
import { createApp } from "../../src/app";
import { closeDbConnection, resetDbConnection, getCollections } from "../../src/repositories/mongodb/db";
import type { Express } from "express";

let app: Express;
let ownerToken: string;
let ownerId: string;
let adminToken: string;
let adminId: string;
let categoryId: string;
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

  // Konu sahibi
  const ownerRes = await request(app).post("/api/auth/register").send({
    email: "edit_owner@test.com",
    password: "ownerpass123",
    displayName: "KonuSahibi",
    userType: "emigrant",
  });
  ownerToken = ownerRes.body.token;
  ownerId = ownerRes.body.user.id;

  // Admin
  const adminRes = await request(app).post("/api/auth/register").send({
    email: "edit_admin@test.com",
    password: "adminpass123",
    displayName: "Admin",
    userType: "emigrant",
  });
  adminId = adminRes.body.user.id;
  await makeAdmin("edit_admin@test.com");
  const loginRes = await request(app).post("/api/auth/login").send({
    email: "edit_admin@test.com",
    password: "adminpass123",
  });
  adminToken = loginRes.body.token;

  // Ülke + kategori
  const countryRes = await request(app)
    .post("/api/forum/countries")
    .set("Authorization", `Bearer ${adminToken}`)
    .send({ name: "Test Ülke", code: "TU" });
  const countryId = countryRes.body.id ?? countryRes.body._id;

  const catRes = await request(app)
    .post("/api/forum/categories")
    .set("Authorization", `Bearer ${adminToken}`)
    .send({ countryId, name: "Genel" });
  categoryId = catRes.body.id ?? catRes.body._id;

  // Konu oluştur (owner)
  await makePremium(ownerId);
  const topicRes = await request(app)
    .post("/api/forum/topics")
    .set("Authorization", `Bearer ${ownerToken}`)
    .send({ categoryId, title: "Test konusu başlığı buraya", content: "İçerik" });
  topicId = topicRes.body.id ?? topicRes.body._id;

  // Admin onaylar
  await request(app)
    .patch(`/api/admin/forum/topics/${topicId}/status`)
    .set("Authorization", `Bearer ${adminToken}`)
    .send({ status: "approved" });
});

afterAll(async () => {
  await closeDbConnection();
});

// ── FRM-TPC-005: Edit request bildirimleri ────────────────────────────────────

describe("FRM-TPC-005 — Edit request bildirimleri", () => {
  let editRequestId: string;

  it("EN-01: Owner edit-request gönderince kendi bildirim feed'inde 'edit_request' görünür", async () => {
    const res = await request(app)
      .post(`/api/forum/topics/${topicId}/edit-request`)
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({ title: "Düzeltilmiş başlık metnini buraya yazıyorum", content: "Güncellendi" });
    expect(res.status).toBe(201);
    editRequestId = res.body.id;

    const notifs = await getNotifications(ownerToken);
    const ack = notifs.find((n: any) => n.type === "edit_request" && n.userId === ownerId);
    expect(ack).toBeDefined();
    expect(ack.title).toContain("alındı");
    expect(ack.targetId).toBe(topicId);
  });

  it("EN-02: Admin edit-request listesinde talep görünür", async () => {
    const res = await request(app)
      .get("/api/admin/forum/edit-requests")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    const req = res.body.find((r: any) => r.id === editRequestId);
    expect(req).toBeDefined();
    expect(req.status).toBe("pending");
    expect(req.requesterId).toBe(ownerId);
  });

  it("EN-03: Admin onaylayınca owner'a 'edit_approved' bildirimi gönderilir", async () => {
    const res = await request(app)
      .patch(`/api/admin/forum/edit-requests/${editRequestId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ status: "approved" });
    expect(res.status).toBe(200);

    const notifs = await getNotifications(ownerToken);
    const approval = notifs.find((n: any) => n.type === "edit_approved");
    expect(approval).toBeDefined();
    expect(approval.targetId).toBe(topicId);
    expect(approval.title).toContain("onaylandı");
  });

  it("EN-04: Onay sonrası konunun başlığı güncellenir", async () => {
    const res = await request(app)
      .get(`/api/forum/topics/${topicId}`)
      .set("Authorization", `Bearer ${ownerToken}`);
    expect(res.status).toBe(200);
    expect(res.body.title).toBe("Düzeltilmiş başlık metnini buraya yazıyorum");
    expect(res.body.editedAt).toBeDefined();
  });
});

// ── FRM-TPC-005: Edit request reddedilince bildirim ──────────────────────────

describe("FRM-TPC-005 — Edit request ret bildirimi", () => {
  let rejectRequestId: string;

  beforeAll(async () => {
    // İkinci bir edit request gönder
    const res = await request(app)
      .post(`/api/forum/topics/${topicId}/edit-request`)
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({ title: "Reddedilecek olan başlık değişikliği", content: "Yeni içerik" });
    rejectRequestId = res.body.id;
  });

  it("EN-05: Admin reddedince owner'a 'edit_rejected' bildirimi gönderilir", async () => {
    const res = await request(app)
      .patch(`/api/admin/forum/edit-requests/${rejectRequestId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ status: "rejected", rejectionReason: "Başlık politikaya uymuyor." });
    expect(res.status).toBe(200);

    const notifs = await getNotifications(ownerToken);
    const rejection = notifs.find((n: any) => n.type === "edit_rejected");
    expect(rejection).toBeDefined();
    expect(rejection.targetId).toBe(topicId);
    expect(rejection.message).toContain("Başlık politikaya uymuyor.");
  });
});

// ── Staff doğrudan topic günceller → owner bildirim ──────────────────────────

describe("Staff doğrudan topic günceller — owner bildirimi", () => {
  it("EN-06: Staff PATCH /topics/:id yapınca owner'a 'edit_approved' bildirimi gönderilir", async () => {
    const notifsBefore = await getNotifications(ownerToken);
    const countBefore = notifsBefore.filter((n: any) => n.type === "edit_approved").length;

    await request(app)
      .patch(`/api/forum/topics/${topicId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ title: "Moderatör tarafından düzenlenen başlık", content: "Güncel içerik" });

    const notifsAfter = await getNotifications(ownerToken);
    const editNotifs = notifsAfter.filter((n: any) => n.type === "edit_approved");
    expect(editNotifs.length).toBeGreaterThan(countBefore);
    const staffEditNotif = editNotifs.find((n: any) => n.title.includes("düzenlendi"));
    expect(staffEditNotif).toBeDefined();
    expect(staffEditNotif.targetId).toBe(topicId);
  });

  it("EN-07: Admin kendi konusunu düzenlerse kendine bildirim gitMEZ", async () => {
    // Admin'in kendi konusu (başka bir topic oluştur, admin olarak)
    await makePremium(adminId);
    const adminTopicRes = await request(app)
      .post("/api/forum/topics")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ categoryId, title: "Admin kendi konusu başlığı", content: "İçerik" });
    const adminTopicId = adminTopicRes.body.id ?? adminTopicRes.body._id;

    const notifsBefore = await getNotifications(adminToken);
    const countBefore = notifsBefore.filter((n: any) => n.type === "edit_approved").length;

    await request(app)
      .patch(`/api/forum/topics/${adminTopicId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ title: "Admin kendi konusunu düzenledi buraya bakın" });

    const notifsAfter = await getNotifications(adminToken);
    const countAfter = notifsAfter.filter((n: any) => n.type === "edit_approved").length;
    // Kendini düzenlediğinde bildirim gitMEmeli
    expect(countAfter).toBe(countBefore);
  });
});

// ── FRM-TPC-006: Silme talebi bildirimleri ───────────────────────────────────

describe("FRM-TPC-006 — Silme talebi bildirimleri", () => {
  it("EN-08: Silme talebi gönderilince admin'e 'admin_deletion_request' bildirimi gönderilir", async () => {
    const notifsBefore = await getNotifications(adminToken);
    const countBefore = notifsBefore.filter((n: any) => n.type === "admin_deletion_request").length;

    const res = await request(app)
      .post(`/api/forum/topics/${topicId}/deletion-request`)
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({ reason: "Bu konuyu kaldırmak istiyorum artık." });
    expect(res.status).toBe(201);

    const notifsAfter = await getNotifications(adminToken);
    const delReqNotifs = notifsAfter.filter((n: any) => n.type === "admin_deletion_request");
    expect(delReqNotifs.length).toBeGreaterThan(countBefore);
  });

  it("EN-09: Aynı konu için ikinci silme talebi → 409 Conflict", async () => {
    const res = await request(app)
      .post(`/api/forum/topics/${topicId}/deletion-request`)
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({ reason: "Yine silmek istiyorum bu konuyu." });
    expect(res.status).toBe(409);
  });

  it("EN-10: 5 karakterden kısa sebep → 400 Bad Request", async () => {
    // Farklı bir topic için dene (bu topic'in zaten talebi var)
    const newTopicRes = await request(app)
      .post("/api/forum/topics")
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({ categoryId, title: "Silme testi için yeni konu başlığı", content: "İçerik" });
    const newTopicId = newTopicRes.body.id ?? newTopicRes.body._id;

    // Admin onayla
    await request(app)
      .patch(`/api/admin/forum/topics/${newTopicId}/status`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ status: "approved" });

    const res = await request(app)
      .post(`/api/forum/topics/${newTopicId}/deletion-request`)
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({ reason: "kısa" });
    expect(res.status).toBe(400);
  });
});
