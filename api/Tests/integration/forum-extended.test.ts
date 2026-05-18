/**
 * Integration tests for FRM-TPC-003/005/006/008 + FRM-CMT-003/004/005/006/007
 * + NTF-EVT-001/002/003/004/005
 *
 * Run: npm test -- forum-extended
 */
import request from "supertest";
import { createApp } from "../../src/app";
import { closeDbConnection, resetDbConnection, getCollections } from "../../src/repositories/mongodb/db";
import type { Express } from "express";

let app: Express;
let userToken: string;
let userId: string;
let userName: string;
let user2Token: string;
let user2Id: string;
let adminToken: string;
let adminId: string;
let modToken: string;
let modId: string;
let countryId: string;
let categoryId: string;

async function setRole(email: string, role: "admin" | "moderator" | "user") {
  const { users } = await getCollections();
  await users.updateOne({ email }, { $set: { role } });
}

async function giveCredits(uid: string, amount: number) {
  const { users } = await getCollections();
  await users.updateOne({ _id: uid }, { $set: { credits: amount } });
}

async function reLogin(email: string, password: string): Promise<string> {
  const res = await request(app).post("/api/auth/login").send({ email, password });
  return res.body.token;
}

beforeAll(async () => {
  resetDbConnection();
  app = createApp({ skipRateLimit: true });
  await request(app).get("/api/health");

  // User 1 (topic author)
  const u1 = await request(app).post("/api/auth/register").send({
    email: "ext_user1@test.com",
    password: "extpass123",
    displayName: "ExtUser One",
    userType: "emigrant",
  });
  userToken = u1.body.token;
  userId = u1.body.user.id;
  userName = u1.body.user.displayName;

  // User 2 (commenter / reporter)
  const u2 = await request(app).post("/api/auth/register").send({
    email: "ext_user2@test.com",
    password: "extpass123",
    displayName: "ExtUser Two",
    userType: "emigrant",
  });
  user2Token = u2.body.token;
  user2Id = u2.body.user.id;

  // Admin
  const a = await request(app).post("/api/auth/register").send({
    email: "ext_admin@test.com",
    password: "adminpass123",
    displayName: "ExtAdmin",
    userType: "emigrant",
  });
  adminId = a.body.user.id;
  await setRole("ext_admin@test.com", "admin");
  adminToken = await reLogin("ext_admin@test.com", "adminpass123");

  // Moderator
  const m = await request(app).post("/api/auth/register").send({
    email: "ext_mod@test.com",
    password: "modpass123",
    displayName: "ExtMod",
    userType: "emigrant",
  });
  modId = m.body.user.id;
  await setRole("ext_mod@test.com", "moderator");
  modToken = await reLogin("ext_mod@test.com", "modpass123");

  // Country + Category (via admin)
  const c = await request(app)
    .post("/api/forum/countries")
    .set("Authorization", `Bearer ${adminToken}`)
    .send({ name: "Ext Country", code: "EX" });
  countryId = c.body.id || c.body._id;

  const cat = await request(app)
    .post("/api/forum/categories")
    .set("Authorization", `Bearer ${adminToken}`)
    .send({ countryId, name: "ExtCat" });
  categoryId = cat.body.id || cat.body._id;
});

afterAll(async () => {
  await closeDbConnection();
});

// ─────────────────────────────────────────────────────────────────────────────
// FRM-TPC-003: Konu body desteği
// ─────────────────────────────────────────────────────────────────────────────
describe("FRM-TPC-003: createTopic supports content field", () => {
  it("admin creates topic with title + content → persists both", async () => {
    const res = await request(app)
      .post("/api/forum/topics")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ categoryId, title: "Konu başlığım uzun", content: "Detaylı içerik metni burada." });
    expect(res.status).toBe(200);
    expect(res.body.title).toBe("Konu başlığım uzun");
    expect(res.body.content).toBe("Detaylı içerik metni burada.");
  });

  it("title-only topic still works (content optional)", async () => {
    const res = await request(app)
      .post("/api/forum/topics")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ categoryId, title: "Sadece başlık" });
    expect(res.status).toBe(200);
    expect(res.body.title).toBe("Sadece başlık");
    expect(res.body.content).toBeUndefined();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// FRM-TPC-005: Konu düzenleme
// ─────────────────────────────────────────────────────────────────────────────
describe("FRM-TPC-005: PATCH /forum/topics/:id (topic edit)", () => {
  let topicId: string;

  beforeAll(async () => {
    await giveCredits(userId, 500);
    const res = await request(app)
      .post("/api/forum/topics")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ categoryId, title: "Düzenlenecek konu başlığı", content: "ilk içerik" });
    topicId = res.body.id || res.body._id;
  });

  it("owner edits title within 24h → 200 + editedAt set", async () => {
    const res = await request(app)
      .patch(`/api/forum/topics/${topicId}`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({ title: "Yeni başlık metni 10+" });
    expect(res.status).toBe(200);
    expect(res.body.title).toBe("Yeni başlık metni 10+");
    expect(res.body.editedAt).toBeTruthy();
  });

  it("owner edits content → 200", async () => {
    const res = await request(app)
      .patch(`/api/forum/topics/${topicId}`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({ content: "yeni içerik metni" });
    expect(res.status).toBe(200);
    expect(res.body.content).toBe("yeni içerik metni");
  });

  it("title shorter than 10 chars → 400", async () => {
    const res = await request(app)
      .patch(`/api/forum/topics/${topicId}`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({ title: "kısa" });
    expect(res.status).toBe(400);
  });

  it("empty body (no title or content) → 400", async () => {
    const res = await request(app)
      .patch(`/api/forum/topics/${topicId}`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({});
    expect(res.status).toBe(400);
  });

  it("other user editing → 403", async () => {
    const res = await request(app)
      .patch(`/api/forum/topics/${topicId}`)
      .set("Authorization", `Bearer ${user2Token}`)
      .send({ title: "Saldırgan değişiklik" });
    expect(res.status).toBe(403);
  });

  it("admin can edit any topic (no time limit)", async () => {
    const res = await request(app)
      .patch(`/api/forum/topics/${topicId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ title: "Admin düzenledi başlığı" });
    expect(res.status).toBe(200);
  });

  it("owner edit after 24h window → 403", async () => {
    // Manually backdate
    const { forumTopics } = await getCollections();
    const oldDate = new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString();
    await forumTopics.updateOne({ _id: topicId }, { $set: { createdAt: oldDate } });

    const res = await request(app)
      .patch(`/api/forum/topics/${topicId}`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({ title: "Geç düzenleme denemesi" });
    expect(res.status).toBe(403);
  });

  it("non-existent topic → 404", async () => {
    const res = await request(app)
      .patch(`/api/forum/topics/non-existent-id`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({ title: "Hiç bir şey" });
    expect(res.status).toBe(404);
  });

  it("unauthenticated → 401", async () => {
    const res = await request(app)
      .patch(`/api/forum/topics/${topicId}`)
      .send({ title: "Yetkisiz değişiklik" });
    expect(res.status).toBe(401);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// FRM-TPC-006: Konu silme talebi (admin onayına tabi)
// ─────────────────────────────────────────────────────────────────────────────
describe("FRM-TPC-006: Topic deletion request flow", () => {
  let topicId: string;
  let reqId: string;

  beforeAll(async () => {
    await giveCredits(userId, 500);
    const res = await request(app)
      .post("/api/forum/topics")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ categoryId, title: "Silinecek konu başlığı" });
    topicId = res.body.id || res.body._id;
  });

  it("owner creates deletion request with reason → 201", async () => {
    const res = await request(app)
      .post(`/api/forum/topics/${topicId}/deletion-request`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({ reason: "Yanlışlıkla açtım." });
    expect(res.status).toBe(201);
    expect(res.body.status).toBe("pending");
    expect(res.body.reason).toBe("Yanlışlıkla açtım.");
    reqId = res.body.id;
  });

  it("reason too short → 400", async () => {
    // Create new topic since the previous already has a pending request
    const t = await request(app)
      .post("/api/forum/topics")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ categoryId, title: "Reason test başlığı" });
    const tid = t.body.id;
    const res = await request(app)
      .post(`/api/forum/topics/${tid}/deletion-request`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ reason: "az" });
    expect(res.status).toBe(400);
  });

  it("non-owner / non-staff cannot request deletion → 403", async () => {
    const t = await request(app)
      .post("/api/forum/topics")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ categoryId, title: "Yetki test başlığı" });
    const tid = t.body.id;
    const res = await request(app)
      .post(`/api/forum/topics/${tid}/deletion-request`)
      .set("Authorization", `Bearer ${user2Token}`)
      .send({ reason: "Beğenmedim bu konuyu." });
    expect(res.status).toBe(403);
  });

  it("duplicate pending request → 409", async () => {
    const res = await request(app)
      .post(`/api/forum/topics/${topicId}/deletion-request`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({ reason: "Tekrar deniyorum şimdi." });
    expect(res.status).toBe(409);
  });

  it("GET deletion-request → returns pending request", async () => {
    const res = await request(app)
      .get(`/api/forum/topics/${topicId}/deletion-request`)
      .set("Authorization", `Bearer ${userToken}`);
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("pending");
  });

  it("admin lists pending deletion requests", async () => {
    const res = await request(app)
      .get(`/api/admin/forum/deletion-requests`)
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.find((r: any) => r.id === reqId)).toBeTruthy();
  });

  it("non-admin cannot list deletion requests → 403", async () => {
    const res = await request(app)
      .get(`/api/admin/forum/deletion-requests`)
      .set("Authorization", `Bearer ${userToken}`);
    expect(res.status).toBe(403);
  });

  it("admin approves deletion → topic soft-deleted + requester notified", async () => {
    const res = await request(app)
      .patch(`/api/admin/forum/deletion-requests/${reqId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ status: "approved" });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("approved");

    // Topic should be gone from public list
    const cat = await request(app).get(`/api/forum/categories/${categoryId}/topics`);
    const found = (cat.body.data ?? cat.body).find?.((t: any) => t.id === topicId);
    expect(found).toBeFalsy();

    // Requester notification
    const notifs = await request(app)
      .get("/api/notifications")
      .set("Authorization", `Bearer ${userToken}`);
    const n = notifs.body.find((x: any) => x.type === "deletion_approved" && x.targetId === topicId);
    expect(n).toBeTruthy();
  });

  it("admin rejects with reason → request becomes 'rejected' + requester notified", async () => {
    // New topic + new request
    const t = await request(app)
      .post("/api/forum/topics")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ categoryId, title: "Reddedilecek silme konusu" });
    const tid = t.body.id;
    const r = await request(app)
      .post(`/api/forum/topics/${tid}/deletion-request`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ reason: "Boş ver, sil bunu." });

    const reject = await request(app)
      .patch(`/api/admin/forum/deletion-requests/${r.body.id}`)
      .set("Authorization", `Bearer ${modToken}`)
      .send({ status: "rejected", rejectionReason: "Konu iyi durumda, silinmemeli." });
    expect(reject.status).toBe(200);
    expect(reject.body.status).toBe("rejected");

    // Topic should still exist
    const topic = await request(app).get(`/api/forum/categories/${categoryId}/topics`);
    const found = (topic.body.data ?? topic.body).find?.((t: any) => t.id === tid);
    expect(found).toBeTruthy();
  });

  it("rejection without reason → 400", async () => {
    const t = await request(app)
      .post("/api/forum/topics")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ categoryId, title: "Sebepsiz red testi konusu" });
    const r = await request(app)
      .post(`/api/forum/topics/${t.body.id}/deletion-request`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ reason: "Test için silelim." });
    const res = await request(app)
      .patch(`/api/admin/forum/deletion-requests/${r.body.id}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ status: "rejected" });
    expect(res.status).toBe(400);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// FRM-TPC-008: Favoriler
// ─────────────────────────────────────────────────────────────────────────────
describe("FRM-TPC-008: Topic favorites", () => {
  let topicId: string;

  beforeAll(async () => {
    const res = await request(app)
      .post("/api/forum/topics")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ categoryId, title: "Favorilenecek konu başlığı" });
    topicId = res.body.id;
  });

  it("toggle favorite → favorited:true", async () => {
    const res = await request(app)
      .post(`/api/forum/topics/${topicId}/favorite`)
      .set("Authorization", `Bearer ${userToken}`);
    expect(res.status).toBe(200);
    expect(res.body.favorited).toBe(true);
  });

  it("GET favorite → favorited:true", async () => {
    const res = await request(app)
      .get(`/api/forum/topics/${topicId}/favorite`)
      .set("Authorization", `Bearer ${userToken}`);
    expect(res.status).toBe(200);
    expect(res.body.favorited).toBe(true);
  });

  it("/users/me/favorites includes the topic", async () => {
    const res = await request(app)
      .get(`/api/users/me/favorites`)
      .set("Authorization", `Bearer ${userToken}`);
    expect(res.status).toBe(200);
    expect(res.body.find((t: any) => t.id === topicId)).toBeTruthy();
  });

  it("toggle again → favorited:false", async () => {
    const res = await request(app)
      .post(`/api/forum/topics/${topicId}/favorite`)
      .set("Authorization", `Bearer ${userToken}`);
    expect(res.status).toBe(200);
    expect(res.body.favorited).toBe(false);
  });

  it("favorite non-existent topic → 404", async () => {
    const res = await request(app)
      .post(`/api/forum/topics/non-existent-id/favorite`)
      .set("Authorization", `Bearer ${userToken}`);
    expect(res.status).toBe(404);
  });

  it("unauthenticated → 401", async () => {
    const res = await request(app).post(`/api/forum/topics/${topicId}/favorite`);
    expect(res.status).toBe(401);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// FRM-CMT-003: Yorum düzenleme
// ─────────────────────────────────────────────────────────────────────────────
describe("FRM-CMT-003: PATCH /forum/topics/:topicId/comments/:id", () => {
  let topicId: string;
  let commentId: string;

  beforeAll(async () => {
    const t = await request(app)
      .post("/api/forum/topics")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ categoryId, title: "Yorum testi konusu başlığı" });
    topicId = t.body.id;

    const c = await request(app)
      .post(`/api/forum/topics/${topicId}/comments`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({ content: "ilk yorum metni" });
    commentId = c.body.id;
  });

  it("owner edits within 15 min → 200", async () => {
    const res = await request(app)
      .patch(`/api/forum/topics/${topicId}/comments/${commentId}`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({ content: "düzenlenmiş yorum" });
    expect(res.status).toBe(200);
    expect(res.body.content).toBe("düzenlenmiş yorum");
    expect(res.body.editedAt).toBeTruthy();
  });

  it("empty content → 400", async () => {
    const res = await request(app)
      .patch(`/api/forum/topics/${topicId}/comments/${commentId}`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({ content: "" });
    expect(res.status).toBe(400);
  });

  it("other user editing → 403", async () => {
    const res = await request(app)
      .patch(`/api/forum/topics/${topicId}/comments/${commentId}`)
      .set("Authorization", `Bearer ${user2Token}`)
      .send({ content: "saldırı düzenlemesi" });
    expect(res.status).toBe(403);
  });

  it("admin can edit any comment", async () => {
    const res = await request(app)
      .patch(`/api/forum/topics/${topicId}/comments/${commentId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ content: "admin düzeltti" });
    expect(res.status).toBe(200);
  });

  it("owner edit after 15 min → 403", async () => {
    const { forumComments } = await getCollections();
    const old = new Date(Date.now() - 16 * 60 * 1000).toISOString();
    await forumComments.updateOne({ _id: commentId }, { $set: { createdAt: old } });

    const res = await request(app)
      .patch(`/api/forum/topics/${topicId}/comments/${commentId}`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({ content: "geç düzenleme" });
    expect(res.status).toBe(403);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// FRM-CMT-004: Yorum silme
// ─────────────────────────────────────────────────────────────────────────────
describe("FRM-CMT-004: DELETE /forum/topics/:topicId/comments/:id", () => {
  let topicId: string;
  let commentId: string;

  beforeAll(async () => {
    const t = await request(app)
      .post("/api/forum/topics")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ categoryId, title: "Silinecek yorum konusu başlığı" });
    topicId = t.body.id;

    const c = await request(app)
      .post(`/api/forum/topics/${topicId}/comments`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({ content: "silinecek yorum" });
    commentId = c.body.id;
  });

  it("other user delete → 403", async () => {
    const res = await request(app)
      .delete(`/api/forum/topics/${topicId}/comments/${commentId}`)
      .set("Authorization", `Bearer ${user2Token}`);
    expect(res.status).toBe(403);
  });

  it("owner deletes own comment → 200, content masked in GET", async () => {
    const del = await request(app)
      .delete(`/api/forum/topics/${topicId}/comments/${commentId}`)
      .set("Authorization", `Bearer ${userToken}`);
    expect(del.status).toBe(200);

    const comments = await request(app).get(`/api/forum/topics/${topicId}/comments`);
    const c = comments.body.find((x: any) => x.id === commentId);
    expect(c).toBeTruthy();
    expect(c.deletedAt).toBeTruthy();
    expect(c.content).toBe("[Bu yorum kaldırıldı]");
  });

  it("deleting already-deleted → 404", async () => {
    const res = await request(app)
      .delete(`/api/forum/topics/${topicId}/comments/${commentId}`)
      .set("Authorization", `Bearer ${userToken}`);
    expect(res.status).toBe(404);
  });

  it("admin can delete any comment", async () => {
    const c = await request(app)
      .post(`/api/forum/topics/${topicId}/comments`)
      .set("Authorization", `Bearer ${user2Token}`)
      .send({ content: "user2'nin yorumu" });
    const res = await request(app)
      .delete(`/api/forum/topics/${topicId}/comments/${c.body.id}`)
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// FRM-CMT-005: Yorum beğenme
// ─────────────────────────────────────────────────────────────────────────────
describe("FRM-CMT-005: POST /forum/topics/:topicId/comments/:id/like", () => {
  let topicId: string;
  let commentId: string;

  beforeAll(async () => {
    const t = await request(app)
      .post("/api/forum/topics")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ categoryId, title: "Beğeni testi konusu başlığı" });
    topicId = t.body.id;

    const c = await request(app)
      .post(`/api/forum/topics/${topicId}/comments`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({ content: "beğenilecek yorum" });
    commentId = c.body.id;
  });

  it("user2 likes → likes:1, hasLiked:true", async () => {
    const res = await request(app)
      .post(`/api/forum/topics/${topicId}/comments/${commentId}/like`)
      .set("Authorization", `Bearer ${user2Token}`);
    expect(res.status).toBe(200);
    expect(res.body.likes).toBe(1);
    expect(res.body.hasLiked).toBe(true);
  });

  it("GET comments → likesCount + hasLiked reflect viewer", async () => {
    const res = await request(app)
      .get(`/api/forum/topics/${topicId}/comments`)
      .set("Authorization", `Bearer ${user2Token}`);
    const c = res.body.find((x: any) => x.id === commentId);
    expect(c.likesCount).toBe(1);
    expect(c.hasLiked).toBe(true);
  });

  it("comment author received 'comment_like' notification", async () => {
    const res = await request(app)
      .get("/api/notifications")
      .set("Authorization", `Bearer ${userToken}`);
    const n = res.body.find((x: any) => x.type === "comment_like" && x.targetId === topicId);
    expect(n).toBeTruthy();
  });

  it("toggle again → likes:0, hasLiked:false", async () => {
    const res = await request(app)
      .post(`/api/forum/topics/${topicId}/comments/${commentId}/like`)
      .set("Authorization", `Bearer ${user2Token}`);
    expect(res.body.likes).toBe(0);
    expect(res.body.hasLiked).toBe(false);
  });

  it("self-like does NOT create notification", async () => {
    // Owner likes own comment
    await request(app)
      .post(`/api/forum/topics/${topicId}/comments/${commentId}/like`)
      .set("Authorization", `Bearer ${userToken}`);

    const res = await request(app)
      .get("/api/notifications")
      .set("Authorization", `Bearer ${userToken}`);
    const likeNotifs = res.body.filter((x: any) => x.type === "comment_like");
    // Sadece user2'nin oluşturduğu (1) olmalı
    expect(likeNotifs.length).toBeLessThanOrEqual(1);
  });

  it("unauthenticated → 401", async () => {
    const res = await request(app).post(`/api/forum/topics/${topicId}/comments/${commentId}/like`);
    expect(res.status).toBe(401);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// FRM-CMT-006: Nested yanıt
// ─────────────────────────────────────────────────────────────────────────────
describe("FRM-CMT-006: Nested replies (parentCommentId)", () => {
  let topicId: string;
  let parentId: string;

  beforeAll(async () => {
    const t = await request(app)
      .post("/api/forum/topics")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ categoryId, title: "Nested yorum konusu başlığı" });
    topicId = t.body.id;

    const p = await request(app)
      .post(`/api/forum/topics/${topicId}/comments`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({ content: "ana yorum" });
    parentId = p.body.id;
  });

  it("create reply with parentCommentId → 200, parentCommentId set", async () => {
    const res = await request(app)
      .post(`/api/forum/topics/${topicId}/comments`)
      .set("Authorization", `Bearer ${user2Token}`)
      .send({ content: "bu bir yanıt", parentCommentId: parentId });
    expect(res.status).toBe(200);
    expect(res.body.parentCommentId).toBe(parentId);
  });

  it("parent comment author receives 'comment_reply' notification", async () => {
    const res = await request(app)
      .get("/api/notifications")
      .set("Authorization", `Bearer ${userToken}`);
    const n = res.body.find((x: any) => x.type === "comment_reply" && x.targetId === topicId);
    expect(n).toBeTruthy();
  });

  it("invalid parentCommentId → 400", async () => {
    const res = await request(app)
      .post(`/api/forum/topics/${topicId}/comments`)
      .set("Authorization", `Bearer ${user2Token}`)
      .send({ content: "geçersiz parent", parentCommentId: "non-existent-id" });
    expect(res.status).toBe(400);
  });

  it("parent from another topic → 400", async () => {
    // Different topic
    const t2 = await request(app)
      .post("/api/forum/topics")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ categoryId, title: "Farklı konu nested testi" });

    const res = await request(app)
      .post(`/api/forum/topics/${t2.body.id}/comments`)
      .set("Authorization", `Bearer ${user2Token}`)
      .send({ content: "yanlış parent", parentCommentId: parentId });
    expect(res.status).toBe(400);
  });

  it("replying to deleted comment → 400", async () => {
    const c = await request(app)
      .post(`/api/forum/topics/${topicId}/comments`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({ content: "silinecek parent" });
    await request(app)
      .delete(`/api/forum/topics/${topicId}/comments/${c.body.id}`)
      .set("Authorization", `Bearer ${userToken}`);

    const res = await request(app)
      .post(`/api/forum/topics/${topicId}/comments`)
      .set("Authorization", `Bearer ${user2Token}`)
      .send({ content: "silinmişe yanıt", parentCommentId: c.body.id });
    expect(res.status).toBe(400);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// FRM-CMT-007: Yorum raporlama
// ─────────────────────────────────────────────────────────────────────────────
describe("FRM-CMT-007 + MOD-REP-001: POST /reports", () => {
  let topicId: string;
  let commentId: string;
  let reportId: string;

  beforeAll(async () => {
    const t = await request(app)
      .post("/api/forum/topics")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ categoryId, title: "Raporlama testi konusu başlığı" });
    topicId = t.body.id;

    const c = await request(app)
      .post(`/api/forum/topics/${topicId}/comments`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({ content: "raporlanacak yorum içeriği" });
    commentId = c.body.id;
  });

  it("user2 reports comment with valid reason → 201", async () => {
    const res = await request(app)
      .post("/api/reports")
      .set("Authorization", `Bearer ${user2Token}`)
      .send({ targetType: "comment", targetId: commentId, reason: "spam", description: "Reklam içeriği." });
    expect(res.status).toBe(201);
    expect(res.body.status).toBe("pending");
    expect(res.body.reason).toBe("spam");
    reportId = res.body.id;
  });

  it("duplicate report from same user → 409", async () => {
    const res = await request(app)
      .post("/api/reports")
      .set("Authorization", `Bearer ${user2Token}`)
      .send({ targetType: "comment", targetId: commentId, reason: "abuse" });
    expect(res.status).toBe(409);
  });

  it("invalid reason → 400", async () => {
    const res = await request(app)
      .post("/api/reports")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ targetType: "comment", targetId: commentId, reason: "bogus" });
    expect(res.status).toBe(400);
  });

  it("invalid targetType → 400", async () => {
    const res = await request(app)
      .post("/api/reports")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ targetType: "user", targetId: commentId, reason: "spam" });
    expect(res.status).toBe(400);
  });

  it("non-existent target → 404", async () => {
    const res = await request(app)
      .post("/api/reports")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ targetType: "comment", targetId: "non-existent-id", reason: "spam" });
    expect(res.status).toBe(404);
  });

  it("report topic as well", async () => {
    const res = await request(app)
      .post("/api/reports")
      .set("Authorization", `Bearer ${user2Token}`)
      .send({ targetType: "topic", targetId: topicId, reason: "misleading", description: "Yanıltıcı bilgi." });
    expect(res.status).toBe(201);
  });

  it("admin sees pending reports", async () => {
    const res = await request(app)
      .get("/api/admin/reports?status=pending")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it("non-admin → 403 on reports queue", async () => {
    const res = await request(app)
      .get("/api/admin/reports")
      .set("Authorization", `Bearer ${userToken}`);
    expect(res.status).toBe(403);
  });

  it("admin resolves report → status updated", async () => {
    const res = await request(app)
      .patch(`/api/admin/reports/${reportId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ status: "resolved", resolution: "Yorum silindi." });
    expect(res.status).toBe(200);
  });

  it("admin dismisses → status dismissed", async () => {
    // New report
    const c = await request(app)
      .post(`/api/forum/topics/${topicId}/comments`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({ content: "başka yorum içeriği" });
    const r = await request(app)
      .post("/api/reports")
      .set("Authorization", `Bearer ${user2Token}`)
      .send({ targetType: "comment", targetId: c.body.id, reason: "other" });

    const res = await request(app)
      .patch(`/api/admin/reports/${r.body.id}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ status: "dismissed" });
    expect(res.status).toBe(200);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// NTF-EVT-001 / 002 / 003 / 004 / 005: Bildirim olayları
// ─────────────────────────────────────────────────────────────────────────────
describe("NTF-EVT-001..005: Notification events", () => {
  let pendingTopicId: string;

  it("NTF-EVT-001: user creates pending topic → 'Konunuz alındı' notification", async () => {
    await giveCredits(userId, 500);
    const t = await request(app)
      .post("/api/forum/topics")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ categoryId, title: "Bildirim testi pending konusu" });
    pendingTopicId = t.body.id;
    expect(t.body.status).toBe("pending");

    // Allow fire-and-forget notification to settle
    await new Promise((r) => setTimeout(r, 100));

    const notifs = await request(app)
      .get("/api/notifications")
      .set("Authorization", `Bearer ${userToken}`);
    const n = notifs.body.find((x: any) => x.type === "system" && x.targetId === pendingTopicId);
    expect(n).toBeTruthy();
    expect(n.title).toMatch(/Konunuz alındı/i);
  });

  it("NTF-EVT-005: admin & moderator receive 'admin_new_pending' notifications", async () => {
    await new Promise((r) => setTimeout(r, 100));

    const adminNotifs = await request(app)
      .get("/api/notifications")
      .set("Authorization", `Bearer ${adminToken}`);
    const adminN = adminNotifs.body.find(
      (x: any) => x.type === "admin_new_pending" && x.targetId === pendingTopicId
    );
    expect(adminN).toBeTruthy();
    expect(adminN.message).toContain(userName);

    const modNotifs = await request(app)
      .get("/api/notifications")
      .set("Authorization", `Bearer ${modToken}`);
    const modN = modNotifs.body.find(
      (x: any) => x.type === "admin_new_pending" && x.targetId === pendingTopicId
    );
    expect(modN).toBeTruthy();
  });

  it("NTF-EVT-002: admin approves → author gets 'topic_approved' notification", async () => {
    const res = await request(app)
      .patch(`/api/forum/topics/${pendingTopicId}/status`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ status: "approved" });
    expect(res.status).toBe(200);

    await new Promise((r) => setTimeout(r, 100));

    const notifs = await request(app)
      .get("/api/notifications")
      .set("Authorization", `Bearer ${userToken}`);
    const n = notifs.body.find((x: any) => x.type === "topic_approved" && x.targetId === pendingTopicId);
    expect(n).toBeTruthy();
    expect(n.title).toMatch(/onaylandı/i);
  });

  it("NTF-EVT-003: admin rejects with reason → author gets 'topic_rejected' notification with reason", async () => {
    await giveCredits(userId, 500);
    const t = await request(app)
      .post("/api/forum/topics")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ categoryId, title: "Reddedilecek konu başlığım" });
    const tid = t.body.id;

    const reject = await request(app)
      .patch(`/api/forum/topics/${tid}/status`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ status: "rejected", reason: "Forum kurallarına aykırı içerik." });
    expect(reject.status).toBe(200);

    await new Promise((r) => setTimeout(r, 100));

    const notifs = await request(app)
      .get("/api/notifications")
      .set("Authorization", `Bearer ${userToken}`);
    const n = notifs.body.find((x: any) => x.type === "topic_rejected" && x.targetId === tid);
    expect(n).toBeTruthy();
    expect(n.message).toContain("Forum kurallarına aykırı içerik.");
  });

  it("NTF-EVT-003: rejection without reason → 400", async () => {
    await giveCredits(userId, 500);
    const t = await request(app)
      .post("/api/forum/topics")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ categoryId, title: "Sebep yok red testi konusu" });
    const res = await request(app)
      .patch(`/api/forum/topics/${t.body.id}/status`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ status: "rejected" });
    expect(res.status).toBe(400);
  });

  it("NTF-EVT-004: new comment on subscribed topic → subscriber gets 'new_comment' notification", async () => {
    // Admin creates approved topic
    const t = await request(app)
      .post("/api/forum/topics")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ categoryId, title: "Yorum bildirim konusu başlığı" });
    const tid = t.body.id;

    // user2 subscribes
    await request(app)
      .post(`/api/forum/topics/${tid}/subscribe`)
      .set("Authorization", `Bearer ${user2Token}`);

    // user1 comments
    await request(app)
      .post(`/api/forum/topics/${tid}/comments`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({ content: "deneme yorumu" });

    await new Promise((r) => setTimeout(r, 100));

    const notifs = await request(app)
      .get("/api/notifications")
      .set("Authorization", `Bearer ${user2Token}`);
    const n = notifs.body.find((x: any) => x.type === "new_comment" && x.targetId === tid);
    expect(n).toBeTruthy();
  });

  it("NTF-EVT-004: commenter does NOT receive notification for own comment", async () => {
    // Topic by user2
    await giveCredits(user2Id, 500);
    const t = await request(app)
      .post("/api/forum/topics")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ categoryId, title: "Kendi yorum testi konusu" });
    const tid = t.body.id;

    // user1 subscribes & comments
    await request(app).post(`/api/forum/topics/${tid}/subscribe`).set("Authorization", `Bearer ${userToken}`);
    await request(app)
      .post(`/api/forum/topics/${tid}/comments`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({ content: "kendi yorumum" });

    await new Promise((r) => setTimeout(r, 100));

    const notifs = await request(app)
      .get("/api/notifications")
      .set("Authorization", `Bearer ${userToken}`);
    const newCommentOnThis = notifs.body.filter(
      (x: any) => x.type === "new_comment" && x.targetId === tid
    );
    expect(newCommentOnThis.length).toBe(0);
  });

  it("NTF-EVT-005: admin-created topic does NOT trigger 'admin_new_pending' (status=approved)", async () => {
    const t = await request(app)
      .post("/api/forum/topics")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ categoryId, title: "Admin'in açtığı bypass konusu" });
    const tid = t.body.id;
    expect(t.body.status).toBe("approved");

    await new Promise((r) => setTimeout(r, 100));

    const notifs = await request(app)
      .get("/api/notifications")
      .set("Authorization", `Bearer ${adminToken}`);
    const adminN = notifs.body.find((x: any) => x.type === "admin_new_pending" && x.targetId === tid);
    expect(adminN).toBeFalsy();
  });
});
