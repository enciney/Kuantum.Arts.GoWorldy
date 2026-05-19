import request from "supertest";
import { createApp } from "../../src/app";
import { closeDbConnection, resetDbConnection, getCollections } from "../../src/repositories/mongodb/db";
import type { Express } from "express";

let app: Express;
let userToken: string;
let user2Token: string;
let adminToken: string;
let categoryId: string;
let topicId: string;

async function makeAdmin(email: string) {
  const { users } = await getCollections();
  await users.updateOne({ email }, { $set: { role: "admin" } });
}

beforeAll(async () => {
  resetDbConnection();
  app = createApp({ skipRateLimit: true });
  await request(app).get("/api/health");

  const u1 = await request(app).post("/api/auth/register").send({
    email: "upvote_user1@test.com",
    password: "passw0rd123",
    displayName: "U1",
    userType: "emigrant",
  });
  userToken = u1.body.token;

  const u2 = await request(app).post("/api/auth/register").send({
    email: "upvote_user2@test.com",
    password: "passw0rd123",
    displayName: "U2",
    userType: "emigrant",
  });
  user2Token = u2.body.token;

  const a = await request(app).post("/api/auth/register").send({
    email: "upvote_admin@test.com",
    password: "passw0rd123",
    displayName: "Adm",
    userType: "emigrant",
  });
  await makeAdmin("upvote_admin@test.com");
  const login = await request(app).post("/api/auth/login").send({
    email: "upvote_admin@test.com",
    password: "passw0rd123",
  });
  adminToken = login.body.token;

  const c = await request(app)
    .post("/api/forum/countries")
    .set("Authorization", `Bearer ${adminToken}`)
    .send({ name: "Upvote Country", code: "UC" });
  const countryId = c.body.id || c.body._id;

  const cat = await request(app)
    .post("/api/forum/categories")
    .set("Authorization", `Bearer ${adminToken}`)
    .send({ countryId, name: "UpvoteCat" });
  categoryId = cat.body.id || cat.body._id;

  const t = await request(app)
    .post("/api/forum/topics")
    .set("Authorization", `Bearer ${adminToken}`)
    .send({ categoryId, title: "Upvote target topic" });
  topicId = t.body.id || t.body._id;
});

afterAll(async () => {
  await closeDbConnection();
});

describe("FRM-TPC-013: Upvote persistence", () => {
  it("toggle ON persists to DB; GET /topics/:id returns hasUpvoted=true and upvotes=1", async () => {
    const post = await request(app)
      .post(`/api/forum/topics/${topicId}/upvote`)
      .set("Authorization", `Bearer ${userToken}`);
    expect(post.status).toBe(200);
    expect(post.body.upvotes).toBe(1);
    expect(post.body.hasVoted).toBe(true);

    const { forumTopicUpvotes } = await getCollections();
    const count = await forumTopicUpvotes.countDocuments({ topicId });
    expect(count).toBe(1);

    const get = await request(app)
      .get(`/api/forum/topics/${topicId}`)
      .set("Authorization", `Bearer ${userToken}`);
    expect(get.status).toBe(200);
    expect(get.body.upvotes).toBe(1);
    expect(get.body.hasUpvoted).toBe(true);
  });

  it("toggle OFF removes record; hasUpvoted=false and upvotes=0", async () => {
    const post = await request(app)
      .post(`/api/forum/topics/${topicId}/upvote`)
      .set("Authorization", `Bearer ${userToken}`);
    expect(post.status).toBe(200);
    expect(post.body.upvotes).toBe(0);
    expect(post.body.hasVoted).toBe(false);

    const get = await request(app)
      .get(`/api/forum/topics/${topicId}`)
      .set("Authorization", `Bearer ${userToken}`);
    expect(get.body.upvotes).toBe(0);
    expect(get.body.hasUpvoted).toBe(false);
  });

  it("different user upvote increments counter but does not flip first user's hasUpvoted", async () => {
    // user1 upvotes
    await request(app)
      .post(`/api/forum/topics/${topicId}/upvote`)
      .set("Authorization", `Bearer ${userToken}`);
    // user2 upvotes
    const p2 = await request(app)
      .post(`/api/forum/topics/${topicId}/upvote`)
      .set("Authorization", `Bearer ${user2Token}`);
    expect(p2.body.upvotes).toBe(2);
    expect(p2.body.hasVoted).toBe(true);

    const getAsU1 = await request(app)
      .get(`/api/forum/topics/${topicId}`)
      .set("Authorization", `Bearer ${userToken}`);
    expect(getAsU1.body.upvotes).toBe(2);
    expect(getAsU1.body.hasUpvoted).toBe(true);

    // Cleanup: remove both for next test
    await request(app)
      .post(`/api/forum/topics/${topicId}/upvote`)
      .set("Authorization", `Bearer ${userToken}`);
    await request(app)
      .post(`/api/forum/topics/${topicId}/upvote`)
      .set("Authorization", `Bearer ${user2Token}`);
  });

  it("GET /forum/categories/:id/topics returns upvotes and hasUpvoted for viewer", async () => {
    await request(app)
      .post(`/api/forum/topics/${topicId}/upvote`)
      .set("Authorization", `Bearer ${userToken}`);

    const list = await request(app)
      .get(`/api/forum/categories/${categoryId}/topics`)
      .set("Authorization", `Bearer ${userToken}`);
    expect(list.status).toBe(200);
    const t = (list.body.data as Array<{ id: string; upvotes: number; hasUpvoted: boolean }>).find(
      (x) => x.id === topicId
    );
    expect(t).toBeDefined();
    expect(t!.upvotes).toBe(1);
    expect(t!.hasUpvoted).toBe(true);

    // As anonymous viewer, hasUpvoted should be false
    const listAnon = await request(app).get(`/api/forum/categories/${categoryId}/topics`);
    const tAnon = (listAnon.body.data as Array<{ id: string; hasUpvoted: boolean }>).find(
      (x) => x.id === topicId
    );
    expect(tAnon!.hasUpvoted).toBe(false);
  });

  it("popular filter list also includes hasUpvoted for viewer", async () => {
    const list = await request(app)
      .get(`/api/forum/categories/${categoryId}/topics?filter=popular`)
      .set("Authorization", `Bearer ${userToken}`);
    expect(list.status).toBe(200);
    const t = (list.body.data as Array<{ id: string; upvotes: number; hasUpvoted: boolean }>).find(
      (x) => x.id === topicId
    );
    expect(t).toBeDefined();
    expect(t!.upvotes).toBeGreaterThanOrEqual(1);
    expect(t!.hasUpvoted).toBe(true);
  });
});
