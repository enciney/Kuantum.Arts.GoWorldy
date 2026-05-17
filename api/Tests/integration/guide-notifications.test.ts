import request from "supertest";
import { createApp } from "../../src/app";
import { closeDbConnection, resetDbConnection, getCollections } from "../../src/repositories/mongodb/db";
import type { Express } from "express";

let app: Express;
let userToken: string;
let userId: string;
let user2Token: string;
let user2Id: string;
let countryId: string;
let stepId: string;
let notificationId: string;

// uuid might not be available — use a simple random id
function randomId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

async function makeAdmin(email: string) {
  const { users } = await getCollections();
  await users.updateOne({ email }, { $set: { role: "admin" } });
}

beforeAll(async () => {
  resetDbConnection();
  app = createApp({ skipRateLimit: true });
  await request(app).get("/api/health");

  // Create user 1
  const user1Res = await request(app).post("/api/auth/register").send({
    email: "guide_user@test.com",
    password: "guidepass123",
    displayName: "GuideUser",
    userType: "emigrant",
  });
  userToken = user1Res.body.token;
  userId = user1Res.body.user.id;

  // Create user 2
  const user2Res = await request(app).post("/api/auth/register").send({
    email: "guide_user2@test.com",
    password: "guidepass456",
    displayName: "GuideUser2",
    userType: "emigrant",
  });
  user2Token = user2Res.body.token;
  user2Id = user2Res.body.user.id;

  // Create an admin to set up forum country
  const adminRes = await request(app).post("/api/auth/register").send({
    email: "guide_admin@test.com",
    password: "adminpass789",
    displayName: "GuideAdmin",
    userType: "emigrant",
  });
  await makeAdmin("guide_admin@test.com");
  const adminLogin = await request(app).post("/api/auth/login").send({
    email: "guide_admin@test.com",
    password: "adminpass789",
  });
  const adminToken = adminLogin.body.token;

  // Create a country
  const countryRes = await request(app)
    .post("/api/forum/countries")
    .set("Authorization", `Bearer ${adminToken}`)
    .send({ name: "Guide Country", code: "GC" });
  countryId = countryRes.body.id || countryRes.body._id;

  // Create a guide step directly in DB
  const { guideSteps, notifications } = await getCollections();
  stepId = randomId();
  await guideSteps.insertOne({
    _id: stepId,
    countryId,
    order: 1,
    question: "Do you have a passport?",
    description: "Verify your passport status",
    stepType: "checklist",
    isGlobal: false,
    options: ["Yes", "No"],
  } as any);

  // Create a notification for user2 (to test ownership check)
  const notifId = randomId();
  await notifications.insertOne({
    _id: notifId,
    userId: user2Id,
    type: "system",
    title: "Test notification",
    message: "For user2",
    read: false,
    createdAt: new Date().toISOString(),
  } as any);
  notificationId = notifId;
});

afterAll(async () => {
  await closeDbConnection();
});

// ── Guide Steps ───────────────────────────────────────────────────────────────
describe("GET /api/guide/steps/:countryId", () => {
  it("→ 200 array", async () => {
    const res = await request(app).get(`/api/guide/steps/${countryId}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });
});

// ── Guide Progress ────────────────────────────────────────────────────────────
describe("POST /api/guide/progress", () => {
  it("save step → 200", async () => {
    const res = await request(app)
      .post("/api/guide/progress")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ stepId, answer: "Yes", countryId });
    expect(res.status).toBe(200);
  });

  it("missing fields → 400", async () => {
    const res = await request(app)
      .post("/api/guide/progress")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ stepId });
    expect(res.status).toBe(400);
  });

  it("invalid stepId → 404", async () => {
    const res = await request(app)
      .post("/api/guide/progress")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ stepId: "nonexistent-step-id", answer: "Yes", countryId });
    expect(res.status).toBe(404);
  });
});

describe("GET /api/guide/progress", () => {
  it("→ 200 array", async () => {
    const res = await request(app)
      .get("/api/guide/progress")
      .set("Authorization", `Bearer ${userToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

// ── Active Country ─────────────────────────────────────────────────────────────
describe("PUT /api/guide/active-country", () => {
  it("→ 200 with countryId", async () => {
    const res = await request(app)
      .put("/api/guide/active-country")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ countryId });
    expect(res.status).toBe(200);
    expect(res.body.activeGuideCountryId).toBe(countryId);
  });

  it("missing countryId → 400", async () => {
    const res = await request(app)
      .put("/api/guide/active-country")
      .set("Authorization", `Bearer ${userToken}`)
      .send({});
    expect(res.status).toBe(400);
  });
});

// ── Guide Progress by Country ─────────────────────────────────────────────────
describe("GET /api/guide/progress/:countryId", () => {
  it("→ 200 array", async () => {
    const res = await request(app)
      .get(`/api/guide/progress/${countryId}`)
      .set("Authorization", `Bearer ${userToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

// ── Notifications ─────────────────────────────────────────────────────────────
describe("GET /api/notifications/", () => {
  it("→ 200 array", async () => {
    const res = await request(app)
      .get("/api/notifications/")
      .set("Authorization", `Bearer ${userToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

describe("GET /api/notifications/unread-count", () => {
  it("→ 200 { count: number }", async () => {
    const res = await request(app)
      .get("/api/notifications/unread-count")
      .set("Authorization", `Bearer ${userToken}`);
    expect(res.status).toBe(200);
    expect(typeof res.body.count).toBe("number");
  });
});

describe("PATCH /api/notifications/:id/read", () => {
  let ownNotifId: string;

  beforeAll(async () => {
    // Create a notification for user1
    const { notifications } = await getCollections();
    const id = randomId();
    await notifications.insertOne({
      _id: id,
      userId,
      type: "system",
      title: "For user1",
      message: "Notification for user1",
      read: false,
      createdAt: new Date().toISOString(),
    } as any);
    ownNotifId = id;
  });

  it("mark own notification as read → 200", async () => {
    const res = await request(app)
      .patch(`/api/notifications/${ownNotifId}/read`)
      .set("Authorization", `Bearer ${userToken}`);
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  it("NO-03: mark other user's notification → 403", async () => {
    const res = await request(app)
      .patch(`/api/notifications/${notificationId}/read`)
      .set("Authorization", `Bearer ${userToken}`);
    expect(res.status).toBe(403);
  });
});

describe("PATCH /api/notifications/read-all", () => {
  it("→ 200", async () => {
    const res = await request(app)
      .patch("/api/notifications/read-all")
      .set("Authorization", `Bearer ${userToken}`);
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });
});

// ── Country Subscriptions ─────────────────────────────────────────────────────
describe("GET /api/notifications/subscriptions", () => {
  it("→ 200 array", async () => {
    const res = await request(app)
      .get("/api/notifications/subscriptions")
      .set("Authorization", `Bearer ${userToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

describe("PATCH /api/notifications/subscriptions/:countryId", () => {
  it("{subscribed: true} → 200", async () => {
    const res = await request(app)
      .patch(`/api/notifications/subscriptions/${countryId}`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({ subscribed: true });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  it("{subscribed: false} → 200", async () => {
    const res = await request(app)
      .patch(`/api/notifications/subscriptions/${countryId}`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({ subscribed: false });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  it("missing subscribed field → 400", async () => {
    const res = await request(app)
      .patch(`/api/notifications/subscriptions/${countryId}`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({});
    expect(res.status).toBe(400);
  });
});

// ── Topic Subscriptions ───────────────────────────────────────────────────────
describe("GET /api/notifications/topic-subscriptions", () => {
  it("→ 200 array", async () => {
    const res = await request(app)
      .get("/api/notifications/topic-subscriptions")
      .set("Authorization", `Bearer ${userToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});
