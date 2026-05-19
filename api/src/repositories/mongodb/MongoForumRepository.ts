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
  TopicDeletionRequest,
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

  async getTopics(categoryId: string, options?: { onlyApproved?: boolean; page?: number; limit?: number; filter?: "popular" | "latest"; viewerId?: string }): Promise<{ data: ForumTopic[]; total: number; page: number; totalPages: number }> {
    const { forumTopics, forumComments, forumTopicUpvotes } = await getCollections();
    const filter: Record<string, unknown> = { categoryId, deletedAt: { $exists: false } };
    if (options?.onlyApproved) filter.status = "approved";
    const page = Math.max(1, options?.page ?? 1);
    const limit = Math.min(100, Math.max(1, options?.limit ?? 20));
    const skip = (page - 1) * limit;
    const viewerId = options?.viewerId;

    if (options?.filter === "popular") {
      const pipeline: Record<string, unknown>[] = [
        { $match: filter },
        {
          $lookup: {
            from: "forumComments",
            localField: "_id",
            foreignField: "topicId",
            as: "_comments",
          },
        },
        {
          $lookup: {
            from: "forumTopicUpvotes",
            localField: "_id",
            foreignField: "topicId",
            as: "_upvotes",
          },
        },
        {
          $addFields: {
            commentCount: { $size: { $ifNull: ["$_comments", []] } },
            upvotes: { $size: { $ifNull: ["$_upvotes", []] } },
          },
        },
        {
          $addFields: {
            score: {
              $add: [
                { $multiply: [{ $ifNull: ["$upvotes", 0] }, 2] },
                { $ifNull: ["$commentCount", 0] },
              ],
            },
          },
        },
        { $sort: { isPinned: -1, score: -1, createdAt: -1 } },
        { $skip: skip },
        { $limit: limit },
        { $project: { _comments: 0, _upvotes: 0, score: 0 } },
      ];
      const [raw, total] = await Promise.all([
        forumTopics.aggregate(pipeline).toArray(),
        forumTopics.countDocuments(filter),
      ]);
      const data = raw.map((t) => {
        const upvotes = typeof (t as { upvotes?: number }).upvotes === "number" ? (t as { upvotes: number }).upvotes : 0;
        return { ...toDoc<ForumTopic>(t as WithId<ForumTopicDoc>), upvotes };
      });
      const withVoted = await attachViewerUpvotes(forumTopicUpvotes, data, viewerId);
      return { data: withVoted, total, page, totalPages: Math.ceil(total / limit) };
    }

    const [topics, total] = await Promise.all([
      forumTopics.find(filter).sort({ isPinned: -1, createdAt: -1 }).skip(skip).limit(limit).toArray(),
      forumTopics.countDocuments(filter),
    ]);
    const data = await attachCommentCounts(forumComments, topics);
    const withUpvotes = await attachUpvoteCounts(forumTopicUpvotes, data);
    const withVoted = await attachViewerUpvotes(forumTopicUpvotes, withUpvotes, viewerId);
    return { data: withVoted, total, page, totalPages: Math.ceil(total / limit) };
  }

  async getTopicById(id: string, viewerId?: string): Promise<ForumTopic | null> {
    const { forumTopics, forumComments, forumTopicUpvotes } = await getCollections();
    const topic = await forumTopics.findOne({ _id: id });
    if (!topic) return null;
    const [count, upvotes] = await Promise.all([
      forumComments.countDocuments({ topicId: id }),
      forumTopicUpvotes.countDocuments({ topicId: id }),
    ]);
    let hasUpvoted = false;
    if (viewerId) {
      const mine = await forumTopicUpvotes.findOne({ topicId: id, userId: viewerId });
      hasUpvoted = mine !== null;
    }
    return { ...toDoc<ForumTopic>(topic), commentCount: count, upvotes, hasUpvoted };
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

  // FRM-TPC-005: Konu düzenleme
  async updateTopic(id: string, data: { title?: string; content?: string }): Promise<void> {
    const { forumTopics } = await getCollections();
    const update: Record<string, unknown> = { editedAt: new Date().toISOString() };
    if (data.title !== undefined) update.title = data.title;
    if (data.content !== undefined) update.content = data.content;
    await forumTopics.updateOne({ _id: id }, { $set: update });
  }

  // FRM-TPC-006: Soft delete (admin onayı ile)
  async softDeleteTopic(id: string, deletedBy: string): Promise<void> {
    const { forumTopics } = await getCollections();
    await forumTopics.updateOne(
      { _id: id },
      { $set: { deletedAt: new Date().toISOString(), deletedBy } }
    );
  }

  async countTopics(): Promise<number> {
    const { forumTopics } = await getCollections();
    return forumTopics.countDocuments({ deletedAt: { $exists: false } });
  }

  async searchTopics(query: string, countryId?: string): Promise<ForumSearchResult[]> {
    const { forumTopics, forumComments, forumCategories, countries: countriesCol, forumTopicUpvotes } = await getCollections();
    // SEC-04: Regex özel karakterlerini escape et — NoSQL injection önleme
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(escaped, "i");

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

  // ── Favorites (FRM-TPC-008) ────────────────────────────────────────────────

  async toggleFavoriteTopic(topicId: string, userId: string): Promise<{ favorited: boolean }> {
    const { forumTopicFavorites } = await getCollections();
    const existing = await forumTopicFavorites.findOne({ userId, topicId });
    if (existing) {
      await forumTopicFavorites.deleteOne({ userId, topicId });
      return { favorited: false };
    }
    await forumTopicFavorites.insertOne({ userId, topicId, createdAt: new Date().toISOString() });
    return { favorited: true };
  }

  async isTopicFavorited(topicId: string, userId: string): Promise<boolean> {
    const { forumTopicFavorites } = await getCollections();
    const doc = await forumTopicFavorites.findOne({ userId, topicId });
    return doc !== null;
  }

  async getFavoritesByUser(userId: string, limit: number, offset: number): Promise<ForumTopic[]> {
    const { forumTopicFavorites, forumTopics, forumComments } = await getCollections();
    const favs = await forumTopicFavorites.find({ userId }).sort({ createdAt: -1 }).skip(offset).limit(limit).toArray();
    if (!favs.length) return [];
    const topicIds = favs.map((f) => f.topicId);
    const topics = await forumTopics.find({ _id: { $in: topicIds }, deletedAt: { $exists: false } }).toArray();
    // Sort topics in same order as favorites
    const topicMap = new Map(topics.map((t) => [t._id, t]));
    const ordered = topicIds.map((id) => topicMap.get(id)).filter(Boolean) as typeof topics;
    return attachCommentCounts(forumComments, ordered);
  }

  // ── Deletion requests (FRM-TPC-006) ────────────────────────────────────────

  async createDeletionRequest(data: { topicId: string; requesterId: string; reason: string }): Promise<TopicDeletionRequest> {
    const { forumDeletionRequests } = await getCollections();
    const id = crypto.randomUUID();
    const createdAt = new Date().toISOString();
    await forumDeletionRequests.insertOne({
      _id: id,
      topicId: data.topicId,
      requesterId: data.requesterId,
      reason: data.reason,
      status: "pending",
      createdAt,
    });
    return {
      id,
      topicId: data.topicId,
      requesterId: data.requesterId,
      reason: data.reason,
      status: "pending",
      createdAt,
    };
  }

  async getDeletionRequestByTopic(topicId: string): Promise<TopicDeletionRequest | null> {
    const { forumDeletionRequests } = await getCollections();
    const doc = await forumDeletionRequests.findOne({ topicId, status: "pending" });
    if (!doc) return null;
    return toDoc<TopicDeletionRequest>(doc);
  }

  async getPendingDeletionRequests(limit: number, offset: number): Promise<TopicDeletionRequest[]> {
    const { forumDeletionRequests, forumTopics, users } = await getCollections();
    const docs = await forumDeletionRequests
      .find({ status: "pending" })
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit)
      .toArray();
    return Promise.all(
      docs.map(async (d) => {
        const topic = await forumTopics.findOne({ _id: d.topicId }, { projection: { title: 1 } });
        const requester = await users.findOne({ _id: d.requesterId }, { projection: { displayName: 1 } });
        return {
          ...toDoc<TopicDeletionRequest>(d),
          topicTitle: topic?.title ?? "",
          requesterName: requester?.displayName ?? "",
        };
      })
    );
  }

  async resolveDeletionRequest(id: string, status: "approved" | "rejected", resolvedBy: string, rejectionReason?: string): Promise<TopicDeletionRequest | null> {
    const { forumDeletionRequests } = await getCollections();
    const update: Record<string, unknown> = {
      status,
      resolvedBy,
      resolvedAt: new Date().toISOString(),
    };
    if (rejectionReason !== undefined) update.rejectionReason = rejectionReason;
    await forumDeletionRequests.updateOne({ _id: id }, { $set: update });
    const doc = await forumDeletionRequests.findOne({ _id: id });
    return doc ? toDoc<TopicDeletionRequest>(doc) : null;
  }

  // ── Comments ───────────────────────────────────────────────────────────────

  async getComments(topicId: string, viewerId?: string): Promise<ForumComment[]> {
    const { forumComments, users, forumCommentLikes } = await getCollections();
    const comments = await forumComments
      .find({ topicId })
      .sort({ createdAt: 1 })
      .toArray();

    // Fetch like counts (all in one query)
    const ids = comments.map((c) => c._id);
    const likeAgg = await forumCommentLikes
      .aggregate([{ $match: { commentId: { $in: ids } } }, { $group: { _id: "$commentId", cnt: { $sum: 1 } } }])
      .toArray();
    const likeMap = new Map(likeAgg.map((r) => [r._id as unknown as string, r.cnt as number]));

    // Fetch viewer's likes (if logged in)
    const likedSet = new Set<string>();
    if (viewerId) {
      const myLikes = await forumCommentLikes.find({ userId: viewerId, commentId: { $in: ids } }).toArray();
      myLikes.forEach((l) => likedSet.add(l.commentId));
    }

    return Promise.all(
      comments.map(async (c) => {
        const user = await users.findOne({ _id: c.authorId }, { projection: { displayName: 1 } });
        const isDeleted = !!c.deletedAt;
        return {
          ...toDoc<ForumComment>(c),
          authorDisplayName: user?.displayName ?? "",
          content: isDeleted ? "[Bu yorum kaldırıldı]" : c.content,
          likesCount: likeMap.get(c._id) ?? 0,
          hasLiked: likedSet.has(c._id),
        };
      })
    );
  }

  async getCommentById(id: string): Promise<ForumComment | null> {
    const { forumComments, users } = await getCollections();
    const c = await forumComments.findOne({ _id: id });
    if (!c) return null;
    const user = await users.findOne({ _id: c.authorId }, { projection: { displayName: 1 } });
    return {
      ...toDoc<ForumComment>(c),
      authorDisplayName: user?.displayName ?? "",
    };
  }

  async createComment(data: Omit<ForumComment, "id" | "createdAt" | "authorDisplayName" | "likesCount" | "hasLiked">): Promise<ForumComment> {
    const { forumComments, users } = await getCollections();
    const id = crypto.randomUUID();
    const doc: Record<string, unknown> = {
      _id: id,
      topicId: data.topicId,
      authorId: data.authorId,
      content: data.content,
      createdAt: new Date().toISOString(),
    };
    if (data.parentCommentId) doc.parentCommentId = data.parentCommentId;
    await forumComments.insertOne(doc as never);
    const user = await users.findOne({ _id: data.authorId }, { projection: { displayName: 1 } });
    return {
      id,
      topicId: data.topicId,
      authorId: data.authorId,
      content: data.content,
      parentCommentId: data.parentCommentId ?? null,
      createdAt: doc.createdAt as string,
      authorDisplayName: user?.displayName ?? "",
      likesCount: 0,
      hasLiked: false,
    };
  }

  async updateComment(id: string, content: string): Promise<void> {
    const { forumComments } = await getCollections();
    await forumComments.updateOne(
      { _id: id },
      { $set: { content, editedAt: new Date().toISOString() } }
    );
  }

  async softDeleteComment(id: string, deletedBy: string): Promise<void> {
    const { forumComments } = await getCollections();
    await forumComments.updateOne(
      { _id: id },
      { $set: { deletedAt: new Date().toISOString(), deletedBy } }
    );
  }

  async toggleCommentLike(commentId: string, userId: string): Promise<{ likes: number; hasLiked: boolean }> {
    const { forumCommentLikes } = await getCollections();
    const existing = await forumCommentLikes.findOne({ commentId, userId });
    if (existing) {
      await forumCommentLikes.deleteOne({ commentId, userId });
    } else {
      await forumCommentLikes.insertOne({ commentId, userId, createdAt: new Date().toISOString() });
    }
    const likes = await forumCommentLikes.countDocuments({ commentId });
    return { likes, hasLiked: !existing };
  }

  async countComments(): Promise<number> {
    const { forumComments } = await getCollections();
    return forumComments.countDocuments({ deletedAt: { $exists: false } });
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

async function attachUpvoteCounts(
  forumTopicUpvotes: Cols["forumTopicUpvotes"],
  topics: ForumTopic[]
): Promise<ForumTopic[]> {
  if (!topics.length) return topics;
  const ids = topics.map((t) => t.id);
  const agg = await forumTopicUpvotes.aggregate([
    { $match: { topicId: { $in: ids } } },
    { $group: { _id: "$topicId", cnt: { $sum: 1 } } },
  ]).toArray();
  const countMap = new Map(agg.map((r) => [r._id as unknown as string, r.cnt as number]));
  return topics.map((t) => ({ ...t, upvotes: countMap.get(t.id) ?? 0 }));
}

async function attachViewerUpvotes(
  forumTopicUpvotes: Cols["forumTopicUpvotes"],
  topics: ForumTopic[],
  viewerId?: string
): Promise<ForumTopic[]> {
  if (!topics.length) return topics;
  if (!viewerId) return topics.map((t) => ({ ...t, hasUpvoted: false }));
  const ids = topics.map((t) => t.id);
  const mine = await forumTopicUpvotes.find({ userId: viewerId, topicId: { $in: ids } }).toArray();
  const set = new Set(mine.map((m) => m.topicId));
  return topics.map((t) => ({ ...t, hasUpvoted: set.has(t.id) }));
}
