/**
 * Integration tests — SEC-SAN-001: XSS Sanitization (Forum endpoints)
 *
 * Doğrular: topic/yorum oluşturma ve düzenleme endpoint'lerinde
 * HTML/script içerikler DB'ye yazılmadan önce sıyrılıyor.
 */
import request from "supertest";
import { createApp } from "../../src/app";
import { closeDbConnection, resetDbConnection, getCollections } from "../../src/repositories/mongodb/db";
import type { Express } from "express";

let app: Express;
let premiumUserToken: string;
let premiumUserId: string;
let adminToken: string;
let countryId: string;
let categoryId: string;

async function setRole(email: string, role: "admin" | "moderator" | "user") {
  const { users } = await getCollections();
  await users.updateOne({ email }, { $set: { role } });
}

async function makePremium(uid: string) {
  const { users } = await getCollections();
  const until = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  await users.updateOne({ _id: uid }, { $set: { isPremium: true, premiumUntil: until } });
}

async function reLogin(email: string, password: string): Promise<string> {
  const res = await request(app).post("/api/auth/login").send({ email, password });
  return res.body.token;
}

beforeAll(async () => {
  resetDbConnection();
  app = createApp({ skipRateLimit: true });
  await request(app).get("/api/health");

  // Premium kullanıcı (topic açabilir)
  const u = await request(app).post("/api/auth/register").send({
    email: "san_user@test.com",
    password: "sanpass123",
    displayName: "SanUser",
    userType: "emigrant",
  });
  premiumUserId = u.body.user.id;
  premiumUserToken = u.body.token;
  await makePremium(premiumUserId);
  premiumUserToken = await reLogin("san_user@test.com", "sanpass123");

  // Admin (topic'leri onaylayacak)
  const a = await request(app).post("/api/auth/register").send({
    email: "san_admin@test.com",
    password: "sanadmin123",
    displayName: "SanAdmin",
    userType: "emigrant",
  });
  await setRole("san_admin@test.com", "admin");
  adminToken = await reLogin("san_admin@test.com", "sanadmin123");

  // Ülke ve kategori oluştur
  const cRes = await request(app)
    .post("/api/forum/countries")
    .set("Authorization", `Bearer ${adminToken}`)
    .send({ name: "Test Ülkesi", code: "TX" });
  countryId = cRes.body.id ?? cRes.body._id;

  const catRes = await request(app)
    .post("/api/forum/categories")
    .set("Authorization", `Bearer ${adminToken}`)
    .send({ countryId, name: "Test Kategori" });
  categoryId = catRes.body.id ?? catRes.body._id;
});

afterAll(async () => {
  await closeDbConnection();
});

// ── Topic Oluşturma — XSS Temizleme ─────────────────────────────────────────

describe("POST /api/forum/topics — XSS sanitization", () => {
  it("script içeren başlık temizlenerek saklanmalı", async () => {
    const res = await request(app)
      .post("/api/forum/topics")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        categoryId,
        title: "<script>alert('xss')</script>Vize başvurusu",
        content: "Normal içerik",
      });
    expect(res.status).toBe(200);
    // Başlıkta script tag olmamalı
    expect(res.body.title).not.toContain("<script>");
    expect(res.body.title).toContain("Vize başvurusu");
  });

  it("script içeren content temizlenerek saklanmalı", async () => {
    const res = await request(app)
      .post("/api/forum/topics")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        categoryId,
        title: "XSS Content Test",
        content: '<script>document.cookie</script>Merhaba dünya',
      });
    expect(res.status).toBe(200);
    // GET ile doğrula
    const topicId = res.body.id ?? res.body._id;
    const getRes = await request(app).get(`/api/forum/topics/${topicId}`);
    expect(getRes.body.content).not.toContain("<script>");
    expect(getRes.body.content).toContain("Merhaba dünya");
  });

  it("img onerror XSS content'te temizlenmeli", async () => {
    const res = await request(app)
      .post("/api/forum/topics")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        categoryId,
        title: "IMG XSS Test",
        content: '<img src=x onerror="evil()"> Gerçek içerik',
      });
    expect(res.status).toBe(200);
    const topicId = res.body.id ?? res.body._id;
    const getRes = await request(app).get(`/api/forum/topics/${topicId}`);
    expect(getRes.body.content).not.toContain("onerror");
    expect(getRes.body.content).toContain("Gerçek içerik");
  });

  it("temiz içerik olduğu gibi saklanmalı (false positive yok)", async () => {
    const cleanContent = "Almanya'da yaşam pahalı ama maaşlar da yüksek. Şehir seçimi önemli.";
    const res = await request(app)
      .post("/api/forum/topics")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ categoryId, title: "Temiz İçerik Testi (XSS yok)", content: cleanContent });
    expect(res.status).toBe(200);
    const topicId = res.body.id ?? res.body._id;
    const getRes = await request(app).get(`/api/forum/topics/${topicId}`);
    expect(getRes.body.content).toBe(cleanContent);
  });
});

// ── Yorum Oluşturma — XSS Temizleme ─────────────────────────────────────────

describe("POST /api/forum/topics/:id/comments — XSS sanitization", () => {
  let topicId: string;

  beforeAll(async () => {
    // Onaylı bir topic oluştur (admin olarak)
    const res = await request(app)
      .post("/api/forum/topics")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ categoryId, title: "Yorum XSS Test Konusu", content: "Konu içeriği" });
    topicId = res.body.id ?? res.body._id;
  });

  it("script içeren yorum temizlenerek saklanmalı", async () => {
    const res = await request(app)
      .post(`/api/forum/topics/${topicId}/comments`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ content: "<script>alert('xss')</script>Gerçek yorum metni" });
    expect(res.status).toBe(200);
    expect(res.body.content).not.toContain("<script>");
    expect(res.body.content).toContain("Gerçek yorum metni");
  });

  it("iframe injection yorumda temizlenmeli", async () => {
    const res = await request(app)
      .post(`/api/forum/topics/${topicId}/comments`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ content: '<iframe src="evil.com"></iframe>Gerçek içerik burada' });
    expect(res.status).toBe(200);
    expect(res.body.content).not.toContain("iframe");
    expect(res.body.content).toContain("Gerçek içerik burada");
  });

  it("yalnızca HTML olan yorum boş string değil, validation hatası vermeli", async () => {
    // Tüm HTML sıyrılırsa içerik boş kalır → 400 beklenir
    const res = await request(app)
      .post(`/api/forum/topics/${topicId}/comments`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ content: "<div><p></p></div>" });
    expect(res.status).toBe(400); // boş yorum kabul edilmemeli
  });

  it("temiz yorum olduğu gibi saklanmalı", async () => {
    const clean = "Bu harika bir konu, teşekkürler!";
    const res = await request(app)
      .post(`/api/forum/topics/${topicId}/comments`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ content: clean });
    expect(res.status).toBe(200);
    expect(res.body.content).toBe(clean);
  });
});

// ── Yorum Düzenleme — XSS Temizleme ─────────────────────────────────────────

describe("PATCH /api/forum/topics/:id/comments/:cid — XSS sanitization", () => {
  let topicId: string;
  let commentId: string;

  beforeAll(async () => {
    const tRes = await request(app)
      .post("/api/forum/topics")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ categoryId, title: "Yorum Edit XSS Testi", content: "Konu" });
    topicId = tRes.body.id ?? tRes.body._id;

    const cRes = await request(app)
      .post(`/api/forum/topics/${topicId}/comments`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ content: "Orijinal yorum içeriği" });
    commentId = cRes.body.id ?? cRes.body._id;
  });

  it("PATCH ile script injection temizlenmeli", async () => {
    const res = await request(app)
      .patch(`/api/forum/topics/${topicId}/comments/${commentId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ content: "<script>steal()</script>Güncellenmiş metin" });
    expect(res.status).toBe(200);
    expect(res.body.content).not.toContain("<script>");
    expect(res.body.content).toContain("Güncellenmiş metin");
  });
});

// ── Topic Düzenleme (staff) — XSS Temizleme ─────────────────────────────────

describe("PATCH /api/forum/topics/:id — XSS sanitization (admin/mod)", () => {
  let topicId: string;

  beforeAll(async () => {
    const res = await request(app)
      .post("/api/forum/topics")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ categoryId, title: "Topic Edit XSS Testi Başlığı", content: "Orijinal" });
    topicId = res.body.id ?? res.body._id;
  });

  it("admin PATCH ile script içeren başlık temizlenmeli", async () => {
    const res = await request(app)
      .patch(`/api/forum/topics/${topicId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ title: "<script>xss</script>Güvenli Yeni Başlık" });
    expect(res.status).toBe(200);
    expect(res.body.title).not.toContain("<script>");
    expect(res.body.title).toContain("Güvenli Yeni Başlık");
  });

  it("admin PATCH ile script içeren content temizlenmeli", async () => {
    const res = await request(app)
      .patch(`/api/forum/topics/${topicId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ content: '<img onerror="xss()">Temiz içerik' });
    expect(res.status).toBe(200);
    const getRes = await request(app).get(`/api/forum/topics/${topicId}`);
    expect(getRes.body.content).not.toContain("onerror");
    expect(getRes.body.content).toContain("Temiz içerik");
  });
});
