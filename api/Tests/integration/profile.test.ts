import request from "supertest";
import { createApp } from "../../src/app";
import { closeDbConnection, resetDbConnection } from "../../src/repositories/mongodb/db";
import type { Express } from "express";

let app: Express;
let token: string;
let userId: string;

beforeAll(async () => {
  resetDbConnection();
  app = createApp({ skipRateLimit: true });
  await request(app).get("/api/health");

  // Create a test user
  const res = await request(app).post("/api/auth/register").send({
    email: "profile_user@test.com",
    password: "profile123",
    displayName: "ProfileUser",
    userType: "emigrant",
  });
  token = res.body.token;
  userId = res.body.user.id;
});

afterAll(async () => {
  await closeDbConnection();
});

// ── GET /api/users/me ─────────────────────────────────────────────────────────
describe("GET /api/users/me", () => {
  it("valid token → 200 with user data", async () => {
    const res = await request(app)
      .get("/api/users/me")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.email).toBe("profile_user@test.com");
  });

  it("no token → 401", async () => {
    const res = await request(app).get("/api/users/me");
    expect(res.status).toBe(401);
  });

  it("passwordHash NOT in response", async () => {
    const res = await request(app)
      .get("/api/users/me")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.passwordHash).toBeUndefined();
  });
});

// ── PATCH /api/users/me ───────────────────────────────────────────────────────
describe("PATCH /api/users/me", () => {
  it("update bio → 200", async () => {
    const res = await request(app)
      .patch("/api/users/me")
      .set("Authorization", `Bearer ${token}`)
      .send({ bio: "My new bio" });
    expect(res.status).toBe(200);
    expect(res.body.bio).toBe("My new bio");
  });

  it("update displayName → 200", async () => {
    const res = await request(app)
      .patch("/api/users/me")
      .set("Authorization", `Bearer ${token}`)
      .send({ displayName: "NewName" });
    expect(res.status).toBe(200);
    expect(res.body.displayName).toBe("NewName");
  });

  it("update sharePhoneNumber toggle → 200", async () => {
    const res = await request(app)
      .patch("/api/users/me")
      .set("Authorization", `Bearer ${token}`)
      .send({ sharePhoneNumber: true });
    expect(res.status).toBe(200);
    expect(res.body.sharePhoneNumber).toBe(true);
  });

  it("U-09: attempt to set role='admin' → role unchanged", async () => {
    const res = await request(app)
      .patch("/api/users/me")
      .set("Authorization", `Bearer ${token}`)
      .send({ role: "admin", displayName: "Hacker" });
    // Either 400 (invalid fields) or 200 but role is not admin
    if (res.status === 200) {
      expect(res.body.role).not.toBe("admin");
    } else {
      expect(res.status).toBeGreaterThanOrEqual(400);
    }
  });

  it("no valid fields → 400", async () => {
    const res = await request(app)
      .patch("/api/users/me")
      .set("Authorization", `Bearer ${token}`)
      .send({ role: "admin", fakeField: "hack" });
    expect(res.status).toBe(400);
  });
});

// ── GET /api/users/me/stats ───────────────────────────────────────────────────
describe("GET /api/users/me/stats", () => {
  it("→ 200 with topicCount, commentCount, completedSteps", async () => {
    const res = await request(app)
      .get("/api/users/me/stats")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(typeof res.body.topicCount).toBe("number");
    expect(typeof res.body.commentCount).toBe("number");
    expect(typeof res.body.completedSteps).toBe("number");
  });
});

// ── GET /api/users/me/activity ────────────────────────────────────────────────
describe("GET /api/users/me/activity", () => {
  it("→ 200 array", async () => {
    const res = await request(app)
      .get("/api/users/me/activity")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

// ── GET /api/users/me/topics ──────────────────────────────────────────────────
describe("GET /api/users/me/topics", () => {
  it("→ 200 array", async () => {
    const res = await request(app)
      .get("/api/users/me/topics")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

// ── GET /api/users/me/comments ────────────────────────────────────────────────
describe("GET /api/users/me/comments", () => {
  it("→ 200 array", async () => {
    const res = await request(app)
      .get("/api/users/me/comments")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

// ── GET /api/guide/home-stats ─────────────────────────────────────────────────
describe("GET /api/guide/home-stats", () => {
  it("→ 200 when no active country set", async () => {
    const res = await request(app)
      .get("/api/guide/home-stats")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("countryId");
    expect(res.body).toHaveProperty("completedSteps");
    expect(res.body).toHaveProperty("totalSteps");
  });
});
