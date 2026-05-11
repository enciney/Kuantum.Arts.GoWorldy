import crypto from "crypto";
import { getDb } from "./db";
import { IForumRepository, ForumCountry, ForumCategory, ForumTopic, ForumComment, ForumStats } from "../interfaces";

export class SqliteForumRepository implements IForumRepository {
  async getCountries(): Promise<ForumCountry[]> {
    return getDb().prepare("SELECT * FROM forum_countries").all() as unknown as ForumCountry[];
  }

  async createCountry(data: Omit<ForumCountry, "id">): Promise<ForumCountry> {
    const id = crypto.randomUUID();
    getDb().prepare("INSERT INTO forum_countries (id, name, code) VALUES (?, ?, ?)").run(id, data.name, data.code);
    return { id, ...data };
  }

  async countCountries(): Promise<number> {
    const result = getDb().prepare("SELECT COUNT(*) as count FROM forum_countries").get() as unknown as { count: number };
    return result.count;
  }

  async getCategories(countryId: string): Promise<ForumCategory[]> {
    return getDb().prepare("SELECT * FROM forum_categories WHERE countryId = ?").all(countryId) as unknown as ForumCategory[];
  }

  async createCategory(data: Omit<ForumCategory, "id">): Promise<ForumCategory> {
    const id = crypto.randomUUID();
    getDb().prepare("INSERT INTO forum_categories (id, countryId, name, parentId) VALUES (?, ?, ?, ?)").run(id, data.countryId, data.name, data.parentId || null);
    return { id, ...data };
  }

  async getTopics(categoryId: string): Promise<ForumTopic[]> {
    return getDb()
      .prepare(`
        SELECT t.*, COALESCE(c.cnt, 0) AS commentCount
        FROM forum_topics t
        LEFT JOIN (
          SELECT topicId, COUNT(*) AS cnt FROM forum_comments GROUP BY topicId
        ) c ON c.topicId = t.id
        WHERE t.categoryId = ?
        ORDER BY t.isPinned DESC, t.createdAt DESC
      `)
      .all(categoryId) as unknown as ForumTopic[];
  }

  async getPendingTopics(limit: number, offset: number): Promise<ForumTopic[]> {
    return getDb()
      .prepare(`
        SELECT t.*, COALESCE(c.cnt, 0) AS commentCount
        FROM forum_topics t
        LEFT JOIN (
          SELECT topicId, COUNT(*) AS cnt FROM forum_comments GROUP BY topicId
        ) c ON c.topicId = t.id
        WHERE t.status = 'pending'
        ORDER BY t.createdAt ASC
        LIMIT ? OFFSET ?
      `)
      .all(limit, offset) as unknown as ForumTopic[];
  }

  async createTopic(data: Omit<ForumTopic, "id" | "createdAt" | "commentCount">): Promise<ForumTopic> {
    const id = crypto.randomUUID();
    getDb().prepare("INSERT INTO forum_topics (id, categoryId, title, authorId, isPinned, status) VALUES (?, ?, ?, ?, ?, ?)").run(id, data.categoryId, data.title, data.authorId, data.isPinned ? 1 : 0, data.status);
    const row = getDb().prepare("SELECT * FROM forum_topics WHERE id = ?").get(id) as unknown as ForumTopic;
    return { ...row, commentCount: 0 };
  }

  async updateTopicStatus(id: string, status: ForumTopic["status"], reason?: string): Promise<void> {
    if (reason !== undefined) {
      getDb().prepare("UPDATE forum_topics SET status = ?, rejectionReason = ? WHERE id = ?").run(status, reason, id);
    } else {
      getDb().prepare("UPDATE forum_topics SET status = ? WHERE id = ?").run(status, id);
    }
  }

  async pinTopic(id: string, isPinned: boolean): Promise<void> {
    getDb().prepare("UPDATE forum_topics SET isPinned = ? WHERE id = ?").run(isPinned ? 1 : 0, id);
  }

  async countTopics(): Promise<number> {
    const result = getDb().prepare("SELECT COUNT(*) as count FROM forum_topics").get() as unknown as { count: number };
    return result.count;
  }

  async getComments(topicId: string): Promise<ForumComment[]> {
    return getDb()
      .prepare(`
        SELECT fc.*, u.displayName AS authorDisplayName
        FROM forum_comments fc
        JOIN users u ON u.id = fc.authorId
        WHERE fc.topicId = ?
        ORDER BY fc.createdAt ASC
      `)
      .all(topicId) as unknown as ForumComment[];
  }

  async createComment(data: Omit<ForumComment, "id" | "createdAt" | "authorDisplayName">): Promise<ForumComment> {
    const id = crypto.randomUUID();
    getDb().prepare("INSERT INTO forum_comments (id, topicId, authorId, content) VALUES (?, ?, ?, ?)").run(id, data.topicId, data.authorId, data.content);
    return getDb()
      .prepare(`
        SELECT fc.*, u.displayName AS authorDisplayName
        FROM forum_comments fc
        JOIN users u ON u.id = fc.authorId
        WHERE fc.id = ?
      `)
      .get(id) as unknown as ForumComment;
  }

  async countComments(): Promise<number> {
    const result = getDb().prepare("SELECT COUNT(*) as count FROM forum_comments").get() as unknown as { count: number };
    return result.count;
  }

  async countTopicsByAuthor(userId: string): Promise<number> {
    const r = getDb()
      .prepare("SELECT COUNT(*) as count FROM forum_topics WHERE authorId = ?")
      .get(userId) as unknown as { count: number };
    return r.count;
  }

  async countCommentsByAuthor(userId: string): Promise<number> {
    const r = getDb()
      .prepare("SELECT COUNT(*) as count FROM forum_comments WHERE authorId = ?")
      .get(userId) as unknown as { count: number };
    return r.count;
  }

  async getRecentCommentsByAuthor(userId: string, limit: number): Promise<{ id: string; content: string; topicId: string; topicTitle: string; createdAt: string }[]> {
    return getDb()
      .prepare(`
        SELECT c.id, c.content, c.topicId, t.title AS topicTitle, c.createdAt
        FROM forum_comments c
        JOIN forum_topics t ON t.id = c.topicId
        WHERE c.authorId = ?
        ORDER BY c.createdAt DESC
        LIMIT ?
      `)
      .all(userId, limit) as unknown as { id: string; content: string; topicId: string; topicTitle: string; createdAt: string }[];
  }

  async getStats(countryId?: string): Promise<ForumStats> {
    const totalTopics = await this.countTopics();
    const totalComments = await this.countComments();
    const activeTopics = getDb().prepare("SELECT COUNT(*) as count FROM forum_topics WHERE status = 'approved'").get() as unknown as { count: number };
    const pendingTopics = getDb().prepare("SELECT COUNT(*) as count FROM forum_topics WHERE status = 'pending'").get() as unknown as { count: number };
    return {
      totalTopics,
      totalComments,
      activeTopics: activeTopics.count,
      pendingTopics: pendingTopics.count,
    };
  }
}
