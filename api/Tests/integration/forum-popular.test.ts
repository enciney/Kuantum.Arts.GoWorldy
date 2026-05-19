import request from "supertest";
import { createApp } from "../../src/app";
import { closeDbConnection, resetDbConnection, getCollections } from "../../src/repositories/mongodb/db";
import type { Express } from "express";
import crypto from "crypto";

let app: Express;
let countryId: string;
let categoryId: string;
let topicA: string;
let topicB: string;
let topicC: string;

async function insertTopic(opts: { title: string; isPinned?: boolean }): Promise<string> {
  const { forumTopics } = await getCollections();
  const id = crypto.randomUUID();
  await forumTopics.insertOne({
    _id: id,
    categoryId,
    title: opts.title,
    authorId: "seed-author",
    isPinned: !!opts.isPinned,
    status: "approved",
    createdAt: new Date().toISOString(),
  } as any);
  return id;
}

async function insertComments(topicId: string, count: number) {
  const { forumComments } = await getCollections();
  for (let i = 0; i < count; i++) {
    await forumComments.insertOne({
      _id: crypto.randomUUID(),
      topicId,
      authorId: "seed-author",
      authorDisplayName: "Seed",
      content: `c${i}`,
      createdAt: new Date().toISOString(),
    } as any);
  }
}

async function insertUpvotes(topicId: string, count: number) {
  const { forumTopicUpvotes } = await getCollections();
  for (let i = 0; i < count; i++) {
    await forumTopicUpvotes.insertOne({
      topicId,
      userId: `voter-${topicId}-${i}`,
      createdAt: new Date().toISOString(),
    } as any);
  }
}

beforeAll(async () => {
  resetDbConnection();
  app = createApp({ skipRateLimit: true });
  await request(app).get("/api/health");

  const { countries, forumCategories } = await getCollections();
  countryId = crypto.randomUUID();
  await countries.insertOne({ _id: countryId, name: "PopCountry", code: "PC" } as any);
  categoryId = crypto.randomUUID();
  await forumCategories.insertOne({ _id: categoryId, countryId, name: "PopCat" } as any);

  topicA = await insertTopic({ title: "Topic A" });
  topicB = await insertTopic({ title: "Topic B" });
  topicC = await insertTopic({ title: "Topic C" });

  await insertUpvotes(topicA, 10);
  await insertComments(topicA, 2);

  await insertUpvotes(topicB, 0);
  await insertComments(topicB, 30);

  await insertUpvotes(topicC, 5);
  await insertComments(topicC, 15);
});

afterAll(async () => {
  await closeDbConnection();
});

describe("GET /api/forum/categories/:id/topics?filter=popular", () => {
  it("FRM-TPC-013: orders by score = upvotes*2 + commentCount DESC", async () => {
    const res = await request(app).get(
      `/api/forum/categories/${categoryId}/topics?filter=popular`
    );
    expect(res.status).toBe(200);
    const data: Array<{ id: string; title: string }> = res.body.data;
    expect(data.length).toBe(3);
    expect(data.map((t) => t.title)).toEqual(["Topic B", "Topic C", "Topic A"]);
  });

  it("pinned topic comes first regardless of score", async () => {
    const { forumTopics } = await getCollections();
    await forumTopics.updateOne({ _id: topicA }, { $set: { isPinned: true } });

    const res = await request(app).get(
      `/api/forum/categories/${categoryId}/topics?filter=popular`
    );
    expect(res.status).toBe(200);
    const data: Array<{ id: string; title: string; isPinned: boolean }> = res.body.data;
    expect(data[0].title).toBe("Topic A");
    expect(data[0].isPinned).toBe(true);
    expect(data.slice(1).map((t) => t.title)).toEqual(["Topic B", "Topic C"]);

    await forumTopics.updateOne({ _id: topicA }, { $set: { isPinned: false } });
  });

  it("without filter=popular uses createdAt sort (default)", async () => {
    const res = await request(app).get(
      `/api/forum/categories/${categoryId}/topics`
    );
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBe(3);
  });
});
