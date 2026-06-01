/**
 * TS-01 — "Sıfırdan premium üye, ilk konu, admin onayı"
 *
 * Kapsanan feature'lar:
 *   AUTH-REG-001, AUTH-LOG-001, USR-PRF-001
 *   PRM-PKG-005, PRM-SUB-001, PRM-SUB-005, PAY-CHK-002
 *   FRM-TPC-002
 *   NTF-EVT-001 (Konunuz alındı)
 *   NTF-EVT-002 (İlanınız onaylandı)
 *   NTF-EVT-005 (Admin pending notification)
 *   ADM-MOD-002 (Admin onaylar)
 *   NTF-SUB-001 (Ülke abonelerine bildirim)
 *
 * Test Stratejisi:
 *   - Her adım sırasıyla çalışır (sequential) — önceki adımın state'ini kullanır
 *   - Async fan-out için 300ms beklenir
 *   - Gerçek MongoDB (in-memory), gerçek Express app
 */

import request from "supertest";
import { createApp } from "../../src/app";
import {
  closeDbConnection,
  resetDbConnection,
  getCollections,
} from "../../src/repositories/mongodb/db";
import type { Express } from "express";

let app: Express;

// Aktörler
let aliToken: string;
let aliId: string;
let adminToken: string;
let subscriberToken: string;
let subscriberId: string;

// Forum
let countryId: string;
let categoryId: string;

// Premium
let premiumPlanId: string;

// Konu
let topicId: string;

// ── Yardımcı fonksiyonlar ─────────────────────────────────────────────────────

async function makeAdmin(email: string): Promise<void> {
  const { users } = await getCollections();
  await users.updateOne({ email }, { $set: { role: "admin" } });
}

async function getNotifications(token: string): Promise<any[]> {
  const res = await request(app)
    .get("/api/notifications")
    .set("Authorization", `Bearer ${token}`);
  expect(res.status).toBe(200);
  return res.body ?? [];
}

async function waitForAsync(ms = 300): Promise<void> {
  await new Promise((r) => setTimeout(r, ms));
}

// ── Kurulum ───────────────────────────────────────────────────────────────────

beforeAll(async () => {
  resetDbConnection();
  app = createApp({ skipRateLimit: true });
  await request(app).get("/api/health");

  // 1. Ali kaydolur
  const aliRes = await request(app).post("/api/auth/register").send({
    email: "ts01_ali@test.com",
    password: "alipass123",
    displayName: "Ali",
    userType: "emigrant",
  });
  aliToken = aliRes.body.token;
  aliId = aliRes.body.user.id;

  // 2. Admin kaydolur + rol atanır
  await request(app).post("/api/auth/register").send({
    email: "ts01_admin@test.com",
    password: "adminpass123",
    displayName: "Admin",
    userType: "emigrant",
  });
  await makeAdmin("ts01_admin@test.com");
  const adminLogin = await request(app).post("/api/auth/login").send({
    email: "ts01_admin@test.com",
    password: "adminpass123",
  });
  adminToken = adminLogin.body.token;

  // 3. Ülke abonesi kaydolur
  const subRes = await request(app).post("/api/auth/register").send({
    email: "ts01_sub@test.com",
    password: "subpass123",
    displayName: "UlkeAbonesi",
    userType: "emigrant",
  });
  subscriberToken = subRes.body.token;
  subscriberId = subRes.body.user.id;

  // 4. Ülke oluştur (admin)
  const countryRes = await request(app)
    .post("/api/forum/countries")
    .set("Authorization", `Bearer ${adminToken}`)
    .send({ name: "Türkiye", code: "TR" });
  countryId = countryRes.body.id ?? countryRes.body._id;

  // 5. Kategori oluştur (admin)
  const catRes = await request(app)
    .post("/api/forum/categories")
    .set("Authorization", `Bearer ${adminToken}`)
    .send({ countryId, name: "Vize ve Pasaport" });
  categoryId = catRes.body.id ?? catRes.body._id;

  // 6. Abone ülkeye abone olur
  await request(app)
    .patch(`/api/notifications/subscriptions/${countryId}`)
    .set("Authorization", `Bearer ${subscriberToken}`)
    .send({ subscribed: true });

  // 7. Subscription plan oluştur (admin)
  const planRes = await request(app)
    .post("/api/admin/premium/plans")
    .set("Authorization", `Bearer ${adminToken}`)
    .send({
      name: "Premium Haftalık",
      description: "7 günlük sınırsız premium",
      price: 179,
      durationDays: 7,
      features: ["Sınırsız konu açma", "Sınırsız yorum"],
      featureKeys: ["unlimited_topics", "unlimited_comments_weekly"],
      isSubscription: true,
      subscriptionDiscountPercent: 15,
      isActive: true,
    });
  premiumPlanId = planRes.body.id;
});

afterAll(async () => {
  await closeDbConnection();
});

// ── BÖLÜM 1: Kayıt & İlk Durum ───────────────────────────────────────────────

describe("TS-01 § 1 — Kayıt & İlk Durum", () => {
  it("TS01-01: Ali kayıtlı, token geçerli, isPremium başlangıçta false", async () => {
    const res = await request(app)
      .get("/api/users/me")
      .set("Authorization", `Bearer ${aliToken}`);

    expect(res.status).toBe(200);
    expect(res.body.email).toBe("ts01_ali@test.com");
    expect(res.body.isPremium).toBe(false);
    expect(res.body.passwordHash).toBeUndefined();
  });

  it("TS01-02: paket listesi döner — subscription plan mevcut", async () => {
    const res = await request(app).get("/api/payment/packages");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.premium)).toBe(true);
    const subscriptionPlan = res.body.premium.find((p: any) => p.isSubscription);
    expect(subscriptionPlan).toBeDefined();
  });
});

// ── BÖLÜM 2: Premium Satın Alma (autoRenew ON, %15 indirim) ─────────────────

describe("TS-01 § 2 — Premium Satın Alma", () => {
  let paymentResponse: any;

  it("TS01-03: autoRenew=true → %15 indirim uygulanır, chargedTL < 179", async () => {
    const res = await request(app)
      .post("/api/payment/process")
      .set("Authorization", `Bearer ${aliToken}`)
      .send({ productType: premiumPlanId, autoRenew: true });

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.discountPct).toBe(15);
    expect(res.body.chargedTL).toBeLessThan(179);
    expect(res.body.autoRenew).toBe(true);

    paymentResponse = res.body;
  });

  it("TS01-04: ödeme sonrası isPremium=true, premiumUntil gelecekte", async () => {
    expect(paymentResponse.isPremium).toBe(true);
    expect(paymentResponse.premiumUntil).toBeTruthy();
    expect(new Date(paymentResponse.premiumUntil).getTime()).toBeGreaterThan(Date.now());
  });

  it("TS01-05: GET /users/me → isPremium=true yansımış (mobile refreshUser simülasyonu)", async () => {
    const res = await request(app)
      .get("/api/users/me")
      .set("Authorization", `Bearer ${aliToken}`);

    expect(res.status).toBe(200);
    expect(res.body.isPremium).toBe(true);
    expect(res.body.premiumUntil).toBeTruthy();
    expect(new Date(res.body.premiumUntil).getTime()).toBeGreaterThan(Date.now());
  });
});

// ── BÖLÜM 3: Konu Oluşturma (Premium → Ücretsiz, Kredi Düşmez) ──────────────

describe("TS-01 § 3 — Konu Oluşturma", () => {
  it("TS01-06: premium kullanıcı konu açar → 200 pending, kredi düşmez", async () => {
    // Önce bakiyeyi ölç
    const profileBefore = await request(app)
      .get("/api/users/me")
      .set("Authorization", `Bearer ${aliToken}`);
    const creditsBefore = profileBefore.body.credits;

    const res = await request(app)
      .post("/api/forum/topics")
      .set("Authorization", `Bearer ${aliToken}`)
      .send({
        categoryId,
        title: "Türkiye vizesi için gerekli belgeler neler?",
        content: "Almanya'dan Türkiye'ye taşınmak istiyorum, vize sürecini anlatır mısınız?",
      });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("pending");
    expect(res.body.title).toBe("Türkiye vizesi için gerekli belgeler neler?");

    topicId = res.body.id ?? res.body._id;
    expect(topicId).toBeTruthy();

    // Kredi düşmemeli
    const profileAfter = await request(app)
      .get("/api/users/me")
      .set("Authorization", `Bearer ${aliToken}`);
    expect(profileAfter.body.credits).toBe(creditsBefore);
  });

  it("TS01-07: konu DB'ye status=pending ile yazılmış", async () => {
    const { forumTopics } = await getCollections();
    const topic = await forumTopics.findOne({ _id: topicId });
    expect(topic).not.toBeNull();
    expect(topic!.status).toBe("pending");
  });
});

// ── BÖLÜM 4: Bildirimler — Konu Alındı (NTF-EVT-001) ────────────────────────

describe("TS-01 § 4 — NTF-EVT-001: 'Konunuz alındı' bildirimi", () => {
  beforeAll(() => waitForAsync(300));

  it("TS01-08: Ali 'Konunuz alındı' system bildirimi almış", async () => {
    const notifs = await getNotifications(aliToken);
    const found = notifs.find(
      (n: any) =>
        n.type === "system" &&
        n.title.includes("Konunuz alındı") &&
        n.targetId === topicId
    );
    expect(found).toBeDefined();
  });

  it("TS01-09: bildirimde konu başlığı mesajda geçiyor", async () => {
    const notifs = await getNotifications(aliToken);
    const found = notifs.find((n: any) => n.type === "system" && n.targetId === topicId);
    expect(found?.message).toContain("Türkiye vizesi için gerekli belgeler neler?");
  });
});

// ── BÖLÜM 5: Admin Bildirimi (NTF-EVT-005) ───────────────────────────────────

describe("TS-01 § 5 — NTF-EVT-005: Admin 'yeni pending' bildirimi", () => {
  it("TS01-10: admin 'admin_new_pending' tipi bildirim almış", async () => {
    const notifs = await getNotifications(adminToken);
    const found = notifs.find(
      (n: any) => n.type === "admin_new_pending" && n.targetId === topicId
    );
    expect(found).toBeDefined();
  });
});

// ── BÖLÜM 6: Admin Onayı (ADM-MOD-002) ──────────────────────────────────────

describe("TS-01 § 6 — ADM-MOD-002: Admin konuyu onaylar", () => {
  it("TS01-11: admin PATCH /forum/topics/:id/status approved → 200", async () => {
    const res = await request(app)
      .patch(`/api/forum/topics/${topicId}/status`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ status: "approved" });

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  it("TS01-12: konu DB'de approved olarak güncellendi", async () => {
    const { forumTopics } = await getCollections();
    const topic = await forumTopics.findOne({ _id: topicId });
    expect(topic!.status).toBe("approved");
  });
});

// ── BÖLÜM 7: Onay Bildirimi (NTF-EVT-002) ────────────────────────────────────

describe("TS-01 § 7 — NTF-EVT-002: 'İlanınız onaylandı' bildirimi", () => {
  beforeAll(() => waitForAsync(300));

  it("TS01-13: Ali 'İlanınız onaylandı 🎉' bildirimi almış", async () => {
    const notifs = await getNotifications(aliToken);
    const found = notifs.find(
      (n: any) => n.type === "topic_approved" && n.targetId === topicId
    );
    expect(found).toBeDefined();
    expect(found.title).toBe("İlanınız onaylandı 🎉");
  });

  it("TS01-14: onay bildiriminde konu başlığı mesajda var", async () => {
    const notifs = await getNotifications(aliToken);
    const found = notifs.find((n: any) => n.type === "topic_approved" && n.targetId === topicId);
    expect(found?.message).toContain("Türkiye vizesi için gerekli belgeler neler?");
  });
});

// ── BÖLÜM 8: Ülke Abonesi Bildirimi (NTF-SUB-001) ────────────────────────────

describe("TS-01 § 8 — NTF-SUB-001: Ülke abonelerine 'topic_new' bildirimi", () => {
  it("TS01-15: Türkiye abonesi 'topic_new' bildirimi almış", async () => {
    const notifs = await getNotifications(subscriberToken);
    const found = notifs.find(
      (n: any) => n.type === "topic_new" && n.targetId === topicId
    );
    expect(found).toBeDefined();
    expect(found.title).toBe("Takip ettiğin ülkede yeni konu");
  });

  it("TS01-16: konu yazarı kendisi için 'topic_new' almaz (authorId filtresi çalışıyor)", async () => {
    const notifs = await getNotifications(aliToken);
    const selfTopicNew = notifs.find(
      (n: any) => n.type === "topic_new" && n.targetId === topicId
    );
    expect(selfTopicNew).toBeUndefined();
  });
});

// ── BÖLÜM 9: Sınır Durumları (Edge Cases) ────────────────────────────────────

describe("TS-01 § 9 — Edge Case: Non-premium kullanıcı aynı akışı denerse", () => {
  let normalToken: string;

  beforeAll(async () => {
    const res = await request(app).post("/api/auth/register").send({
      email: "ts01_normal@test.com",
      password: "normalpass123",
      displayName: "Normal",
      userType: "emigrant",
    });
    normalToken = res.body.token;
  });

  it("TS01-17: non-premium kullanıcı konu açmaya çalışırsa → 402 PREMIUM_REQUIRED", async () => {
    const res = await request(app)
      .post("/api/forum/topics")
      .set("Authorization", `Bearer ${normalToken}`)
      .send({
        categoryId,
        title: "Non-premium konu denemesi başlık",
        content: "içerik var",
      });

    expect(res.status).toBe(402);
    expect(res.body.code).toBe("PREMIUM_REQUIRED");
  });
});

// ── BÖLÜM 10: Tam Bildirim Sayısı Doğrulaması ────────────────────────────────

describe("TS-01 § 10 — Bildirim Tutarlılığı", () => {
  it("TS01-18: notifications koleksiyonunda Ali için 2 bildirim var (alındı + onaylandı)", async () => {
    const { notifications } = await getCollections();
    const aliNotifs = await notifications.find({ userId: aliId }).toArray();
    const relevant = aliNotifs.filter((n) => n.targetId === topicId);
    // system (alındı) + topic_approved (onaylandı)
    expect(relevant.length).toBeGreaterThanOrEqual(2);
  });

  it("TS01-19: abone için tam olarak 1 topic_new bildirimi var (ülke bildirim spam yok)", async () => {
    const { notifications } = await getCollections();
    const subNotifs = await notifications
      .find({ userId: subscriberId, type: "topic_new", targetId: topicId })
      .toArray();
    expect(subNotifs.length).toBe(1);
  });
});
