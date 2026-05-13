import crypto from "crypto";
import { getCollections, toDoc } from "./db";
import {
  IForumRepository,
  ForumCountry,
  ForumCategory,
  ForumTopic,
  ForumComment,
  ForumStats,
  ForumSearchResult,
} from "../interfaces";
import { WithId } from "mongodb";
import { ForumTopicDoc } from "./db";

type Cols = Awaited<ReturnType<typeof getCollections>>;

export class MongoForumRepository implements IForumRepository {

  // ── Countries ──────────────────────────────────────────────────────────────

  async getCountries(): Promise<ForumCountry[]> {
    const { countries: countriesCol, forumTopics } = await getCollections();
    const docs = await countriesCol.find({}).toArray();
    const topicAgg = await forumTopics.aggregate([
      { $match: { status: "approved" } },
      { $lookup: { from: "forumCategories", localField: "categoryId", foreignField: "_id", as: "cat" } },
      { $unwind: "$cat" },
      { $group: { _id: "$cat.countryId", cnt: { $sum: 1 } } },
    ]).toArray();
    const countMap = new Map(topicAgg.map((r) => [r._id as unknown as string, r.cnt as number]));
    return docs.map((c) => ({
      id: c._id,
      name: c.name,
      code: c.code,
      topicCount: countMap.get(c._id) ?? 0,
    }));
  }

  async createCountry(data: Omit<ForumCountry, "id">): Promise<ForumCountry> {
    const { countries: countriesCol } = await getCollections();
    const id = crypto.randomUUID();
    await countriesCol.insertOne({ _id: id, ...data });
    return { id, ...data };
  }

  async countCountries(): Promise<number> {
    const { countries: countriesCol } = await getCollections();
    return countriesCol.countDocuments();
  }

  // ── Categories ─────────────────────────────────────────────────────────────

  async getCategories(countryId: string): Promise<ForumCategory[]> {
    const { forumCategories, forumTopics } = await getCollections();
    const cats = await forumCategories.find({ countryId }).toArray();
    const catIds = cats.map((c) => c._id);
    const topicAgg = await forumTopics.aggregate([
      { $match: { status: "approved", categoryId: { $in: catIds } } },
      { $group: { _id: "$categoryId", cnt: { $sum: 1 } } },
    ]).toArray();
    const countMap = new Map(topicAgg.map((r) => [r._id as unknown as string, r.cnt as number]));
    return cats.map((c) => ({
      ...toDoc<ForumCategory>(c),
      topicCount: countMap.get(c._id) ?? 0,
    }));
  }

  async createCategory(data: Omit<ForumCategory, "id">): Promise<ForumCategory> {
    const { forumCategories } = await getCollections();
    const id = crypto.randomUUID();
    await forumCategories.insertOne({ _id: id, ...data });
    return { id, ...data };
  }

  // ── Topics ─────────────────────────────────────────────────────────────────

  async getTopics(categoryId: string): Promise<ForumTopic[]> {
    const { forumTopics, forumComments } = await getCollections();
    const topics = await forumTopics.find({ categoryId }).sort({ isPinned: -1, createdAt: -1 }).toArray();
    return attachCommentCounts(forumComments, topics);
  }

  async getPendingTopics(limit: number, offset: number): Promise<ForumTopic[]> {
    const { forumTopics, forumComments } = await getCollections();
    const topics = await forumTopics.find({ status: "pending" }).sort({ createdAt: 1 }).skip(offset).limit(limit).toArray();
    return attachCommentCounts(forumComments, topics);
  }

  async createTopic(data: Omit<ForumTopic, "id" | "createdAt" | "commentCount">): Promise<ForumTopic> {
    const { forumTopics } = await getCollections();
    const id = crypto.randomUUID();
    const doc = { _id: id, ...data, createdAt: new Date().toISOString() };
    await forumTopics.insertOne(doc);
    return { ...toDoc<ForumTopic>(doc), commentCount: 0 };
  }

  async updateTopicStatus(id: string, status: ForumTopic["status"], reason?: string): Promise<void> {
    const { forumTopics } = await getCollections();
    const update: Record<string, unknown> = { status };
    if (reason !== undefined) update.rejectionReason = reason;
    await forumTopics.updateOne({ _id: id }, { $set: update });
  }

  async pinTopic(id: string, isPinned: boolean): Promise<void> {
    const { forumTopics } = await getCollections();
    await forumTopics.updateOne({ _id: id }, { $set: { isPinned } });
  }

  async countTopics(): Promise<number> {
    const { forumTopics } = await getCollections();
    return forumTopics.countDocuments();
  }

  async searchTopics(query: string, countryId?: string): Promise<ForumSearchResult[]> {
    const { forumTopics, forumComments, forumCategories, countries: countriesCol, forumTopicUpvotes } = await getCollections();
    const re = new RegExp(query, "i");

    let catIds: string[] | undefined;
    if (countryId) {
      const cats = await forumCategories.find({ countryId }, { projection: { _id: 1 } }).toArray();
      catIds = cats.map((c) => c._id);
    }

    const commentMatch = await forumComments.distinct("topicId", { content: re });
    const filter: Record<string, unknown> = {
      status: "approved",
      $or: [{ title: re }, { _id: { $in: commentMatch } }],
    };
    if (catIds) filter.categoryId = { $in: catIds };

    const topics = await forumTopics.find(filter).sort({ createdAt: -1 }).limit(50).toArray();
    const withCounts = await attachCommentCounts(forumComments, topics);

    return Promise.all(
      withCounts.map(async (t) => {
        const cat = await forumCategories.findOne({ _id: t.categoryId });
        const country = cat ? await countriesCol.findOne({ _id: cat.countryId }) : null;
        const upvotes = await forumTopicUpvotes.countDocuments({ topicId: t.id });
        return {
          ...t,
          upvotes,
          categoryName: cat?.name ?? "",
          countryId: cat?.countryId ?? "",
          countryName: country?.name ?? "",
        };
      })
    );
  }

  // ── Upvotes ────────────────────────────────────────────────────────────────

  async upvoteTopic(topicId: string, userId: string): Promise<{ upvotes: number; hasVoted: boolean }> {
    const { forumTopicUpvotes } = await getCollections();
    const existing = await forumTopicUpvotes.findOne({ topicId, userId });
    if (existing) {
      await forumTopicUpvotes.deleteOne({ topicId, userId });
    } else {
      await forumTopicUpvotes.insertOne({ topicId, userId, createdAt: new Date().toISOString() } as any);
    }
    const upvotes = await forumTopicUpvotes.countDocuments({ topicId });
    return { upvotes, hasVoted: !existing };
  }

  // ── Comments ───────────────────────────────────────────────────────────────

  async getComments(topicId: string): Promise<ForumComment[]> {
    const { forumComments, users } = await getCollections();
    const comments = await forumComments.find({ topicId }).sort({ createdAt: 1 }).toArray();
    return Promise.all(
      comments.map(async (c) => {
        const user = await users.findOne({ _id: c.authorId }, { projection: { displayName: 1 } });
        return {
          ...toDoc<ForumComment>(c),
          authorDisplayName: user?.displayName ?? "",
        };
      })
    );
  }

  async createComment(data: Omit<ForumComment, "id" | "createdAt" | "authorDisplayName">): Promise<ForumComment> {
    const { forumComments, users } = await getCollections();
    const id = crypto.randomUUID();
    const doc = { _id: id, ...data, createdAt: new Date().toISOString() };
    await forumComments.insertOne(doc);
    const user = await users.findOne({ _id: data.authorId }, { projection: { displayName: 1 } });
    return { ...toDoc<ForumComment>(doc), authorDisplayName: user?.displayName ?? "" };
  }

  async countComments(): Promise<number> {
    const { forumComments } = await getCollections();
    return forumComments.countDocuments();
  }

  // ── Stats ──────────────────────────────────────────────────────────────────

  async getStats(_countryId?: string): Promise<ForumStats> {
    const { forumTopics, forumComments } = await getCollections();
    const [totalTopics, totalComments, activeTopics, pendingTopics] = await Promise.all([
      forumTopics.countDocuments(),
      forumComments.countDocuments(),
      forumTopics.countDocuments({ status: "approved" }),
      forumTopics.countDocuments({ status: "pending" }),
    ]);
    return { totalTopics, totalComments, activeTopics, pendingTopics };
  }

  // ── User-scoped ────────────────────────────────────────────────────────────

  async countTopicsByAuthor(userId: string): Promise<number> {
    const { forumTopics } = await getCollections();
    return forumTopics.countDocuments({ authorId: userId });
  }

  async countCommentsByAuthor(userId: string): Promise<number> {
    const { forumComments } = await getCollections();
    return forumComments.countDocuments({ authorId: userId });
  }

  async getTopicsByAuthor(userId: string, limit: number, offset: number): Promise<ForumTopic[]> {
    const { forumTopics, forumComments } = await getCollections();
    const topics = await forumTopics.find({ authorId: userId }).sort({ createdAt: -1 }).skip(offset).limit(limit).toArray();
    return attachCommentCounts(forumComments, topics);
  }

  async getCommentsByAuthor(userId: string, limit: number, offset: number): Promise<{ id: string; topicId: string; topicTitle: string; content: string; createdAt: string }[]> {
    const { forumComments, forumTopics } = await getCollections();
    const comments = await forumComments.find({ authorId: userId }).sort({ createdAt: -1 }).skip(offset).limit(limit).toArray();
    return Promise.all(
      comments.map(async (c) => {
        const topic = await forumTopics.findOne({ _id: c.topicId }, { projection: { title: 1 } });
        return {
          id: c._id,
          topicId: c.topicId,
          topicTitle: topic?.title ?? "",
          content: c.content,
          createdAt: c.createdAt,
        };
      })
    );
  }

  async getRecentCommentsByAuthor(userId: string, limit: number): Promise<{ id: string; content: string; topicId: string; topicTitle: string; createdAt: string }[]> {
    const { forumComments, forumTopics } = await getCollections();
    const comments = await forumComments.find({ authorId: userId }).sort({ createdAt: -1 }).limit(limit).toArray();
    return Promise.all(
      comments.map(async (c) => {
        const topic = await forumTopics.findOne({ _id: c.topicId }, { projection: { title: 1 } });
        return {
          id: c._id,
          content: c.content,
          topicId: c.topicId,
          topicTitle: topic?.title ?? "",
          createdAt: c.createdAt,
        };
      })
    );
  }
}

// ── Shared helper ────────────────────────────────────────────────────────────

async function attachCommentCounts(
  forumComments: Cols["forumComments"],
  topics: WithId<ForumTopicDoc>[]
): Promise<ForumTopic[]> {
  if (!topics.length) return [];
  const ids = topics.map((t) => t._id);
  const agg = await forumComments.aggregate([
    { $match: { topicId: { $in: ids } } },
    { $group: { _id: "$topicId", cnt: { $sum: 1 } } },
  ]).toArray();
  const countMap = new Map(agg.map((r) => [r._id as unknown as string, r.cnt as number]));
  return topics.map((t) => ({
    ...toDoc<ForumTopic>(t),
    commentCount: countMap.get(t._id) ?? 0,
  }));
}
