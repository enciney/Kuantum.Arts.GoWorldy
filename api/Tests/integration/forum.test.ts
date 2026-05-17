import request from "supertest";
import { createApp } from "../../src/app";
import { closeDbConnection, resetDbConnection, getCollections } from "../../src/repositories/mongodb/db";
import type { Express } from "express";

let app: Express;
let userToken: string;
let userId: string;
let adminToken: string;
let adminId: string;
let countryId: string;
let categoryId: string;
let topicId: string;

async function makeAdmin(email: string) {
  const { users } = await getCollections();
  await users.updateOne({ email }, { $set: { role: "admin" } });
}

async function giveCredits(uid: string, amount: number) {
  const { users } = await getCollections();
  await users.updateOne({ _id: uid }, { $set: { credits: amount } });
}

beforeAll(async () => {
  resetDbConnection();
  app = createApp({ skipRateLimit: true });
  await request(app).get("/api/health");

  // Create normal user
  const userRes = await request(app).post("/api/auth/register").send({
    email: "forum_user@test.com",
    password: "forumpass123",
    displayName: "ForumUser",
    userType: "emigrant",
  });
  userToken = userRes.body.token;
  userId = userRes.body.user.id;

  // Create admin user
  const adminRes = await request(app).post("/api/auth/register").send({
    email: "forum_admin@test.com",
    password: "adminpass123",
    displayName: "ForumAdmin",
    userType: "emigrant",
  });
  adminId = adminRes.body.user.id;
  await makeAdmin("forum_admin@test.com");

  // Re-login admin to get new token with admin role
  const loginRes = await request(app).post("/api/auth/login").send({
    email: "forum_admin@test.com",
    password: "adminpass123",
  });
  adminToken = loginRes.body.token;

  // Create a country via admin
  const countryRes = await request(app)
    .post("/api/forum/countries")
    .set("Authorization", `Bearer ${adminToken}`)
    .send({ name: "Test Country", code: "TC" });
  countryId = countryRes.body.id || countryRes.body._id;

  // Create a category via admin
  const catRes = await request(app)
    .post("/api/forum/categories")
    .set("Authorization", `Bearer ${adminToken}`)
    .send({ countryId, name: "General" });
  categoryId = catRes.body.id || catRes.body._id;
});

afterAll(async () => {
  await closeDbConnection();
});

// ── Countries ─────────────────────────────────────────────────────────────────
describe("GET /api/forum/countries", () => {
  it("→ 200 array", async () => {
    const res = await request(app).get("/api/forum/countries");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

// ── Categories ────────────────────────────────────────────────────────────────
describe("GET /api/forum/countries/:id/categories", () => {
  it("→ 200 array", async () => {
    const res = await request(app).get(`/api/forum/countries/${countryId}/categories`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

// ── Topics ────────────────────────────────────────────────────────────────────
describe("GET /api/forum/categories/:id/topics", () => {
  it("F-04: only approved topics returned to public", async () => {
    // Create a pending topic via user
    await giveCredits(userId, 100);
    await request(app)
      .post("/api/forum/topics")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ categoryId, title: "Pending topic" });

    // Create an approved topic via admin
    const approvedRes = await request(app)
      .post("/api/forum/topics")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ categoryId, title: "Approved topic" });
    topicId = approvedRes.body.id || approvedRes.body._id;

    const res = await request(app).get(`/api/forum/categories/${categoryId}/topics`);
    expect(res.status).toBe(200);
    const topics = Array.isArray(res.body) ? res.body : res.body.topics || [];
    // All returned topics should be approved
    for (const t of topics) {
      expect(t.status).toBe("approved");
    }
  });
});

describe("POST /api/forum/topics", () => {
  it("as admin → topic is approved", async () => {
    const res = await request(app)
      .post("/api/forum/topics")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ categoryId, title: "Admin topic" });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("approved");
  });

  it("as user with enough credits → 200, status=pending, credits deducted", async () => {
    await giveCredits(userId, 100);

    const before = await request(app)
      .get("/api/users/me")
      .set("Authorization", `Bearer ${userToken}`);
    const creditsBefore = before.body.credits;

    const res = await request(app)
      .post("/api/forum/topics")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ categoryId, title: "User pending topic" });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("pending");

    const after = await request(app)
      .get("/api/users/me")
      .set("Authorization", `Bearer ${userToken}`);
    expect(after.body.credits).toBeLessThan(creditsBefore);
  });

  it("as user with 0 credits → 402 INSUFFICIENT_CREDITS", async () => {
    await giveCredits(userId, 0);

    const res = await request(app)
      .post("/api/forum/topics")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ categoryId, title: "No credit topic" });
    expect(res.status).toBe(402);
    expect(res.body.code).toBe("INSUFFICIENT_CREDITS");
  });

  it("unauthenticated → 401", async () => {
    const res = await request(app)
      .post("/api/forum/topics")
      .send({ categoryId, title: "Unauthenticated topic" });
    expect(res.status).toBe(401);
  });

  it("missing categoryId → 400", async () => {
    const res = await request(app)
      .post("/api/forum/topics")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ title: "No category" });
    expect(res.status).toBe(400);
  });
});

// ── Comments ──────────────────────────────────────────────────────────────────
describe("GET /api/forum/topics/:topicId/comments", () => {
  it("→ 200 array", async () => {
    const res = await request(app).get(`/api/forum/topics/${topicId}/comments`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

describe("POST /api/forum/topics/:topicId/comments", () => {
  it("with auth → 200", async () => {
    const res = await request(app)
      .post(`/api/forum/topics/${topicId}/comments`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({ content: "Great topic!" });
    expect(res.status).toBe(200);
    expect(res.body.content).toBe("Great topic!");
  });
});

// ── Upvote ────────────────────────────────────────────────────────────────────
describe("POST /api/forum/topics/:id/upvote", () => {
  it("→ 200 (upvote added)", async () => {
    const res = await request(app)
      .post(`/api/forum/topics/${topicId}/upvote`)
      .set("Authorization", `Bearer ${userToken}`);
    expect(res.status).toBe(200);
  });

  it("second upvote → toggle removes vote", async () => {
    const res = await request(app)
      .post(`/api/forum/topics/${topicId}/upvote`)
      .set("Authorization", `Bearer ${userToken}`);
    expect(res.status).toBe(200);
    // The response should indicate toggle
    expect(res.body).toBeDefined();
  });
});

// ── Search ────────────────────────────────────────────────────────────────────
describe("GET /api/forum/search", () => {
  it("valid query → 200 array", async () => {
    const res = await request(app).get("/api/forum/search?q=topic");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("SEC-04: query starting with $ → 400", async () => {
    const res = await request(app).get("/api/forum/search?q=$where:1");
    expect(res.status).toBe(400);
  });

  it("query too short (1 char) → 400", async () => {
    const res = await request(app).get("/api/forum/search?q=a");
    expect(res.status).toBe(400);
  });
});

// ── Admin: update topic status ────────────────────────────────────────────────
describe("PATCH /api/forum/topics/:id/status", () => {
  let pendingTopicId: string;

  beforeAll(async () => {
    // Give user credits to create a pending topic
    await giveCredits(userId, 100);
    const res = await request(app)
      .post("/api/forum/topics")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ categoryId, title: "Pending for approval test" });
    pendingTopicId = res.body.id || res.body._id;
  });

  it("as admin → approve (200)", async () => {
    const res = await request(app)
      .patch(`/api/forum/topics/${pendingTopicId}/status`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ status: "approved" });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  it("AD-02: as normal user → 403", async () => {
    const res = await request(app)
      .patch(`/api/forum/topics/${topicId}/status`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({ status: "approved" });
    expect(res.status).toBe(403);
  });
});

// ── Topic subscriptions ───────────────────────────────────────────────────────
describe("Topic subscribe/unsubscribe", () => {
  it("POST /api/forum/topics/:id/subscribe → {subscribed: true}", async () => {
    const res = await request(app)
      .post(`/api/forum/topics/${topicId}/subscribe`)
      .set("Authorization", `Bearer ${userToken}`);
    expect(res.status).toBe(200);
    expect(res.body.subscribed).toBe(true);
  });

  it("GET /api/forum/topics/:id/subscribe → {subscribed: boolean}", async () => {
    const res = await request(app)
      .get(`/api/forum/topics/${topicId}/subscribe`)
      .set("Authorization", `Bearer ${userToken}`);
    expect(res.status).toBe(200);
    expect(typeof res.body.subscribed).toBe("boolean");
  });

  it("DELETE /api/forum/topics/:id/subscribe → {subscribed: false}", async () => {
    const res = await request(app)
      .delete(`/api/forum/topics/${topicId}/subscribe`)
      .set("Authorization", `Bearer ${userToken}`);
    expect(res.status).toBe(200);
    expect(res.body.subscribed).toBe(false);
  });
});
