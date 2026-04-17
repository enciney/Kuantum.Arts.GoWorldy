import crypto from "crypto";
import { getDb } from "./db";
import { IForumRepository, ForumCountry, ForumCategory, ForumTopic, ForumComment } from "../interfaces";

export class SqliteForumRepository implements IForumRepository {
  async getCountries(): Promise<ForumCountry[]> {
    return getDb().prepare("SELECT * FROM forum_countries").all() as ForumCountry[];
  }

  async createCountry(data: Omit<ForumCountry, "id">): Promise<ForumCountry> {
    const id = crypto.randomUUID();
    getDb().prepare("INSERT INTO forum_countries (id, name, code) VALUES (?, ?, ?)").run(id, data.name, data.code);
    return { id, ...data };
  }

  async getCategories(countryId: string): Promise<ForumCategory[]> {
    return getDb().prepare("SELECT * FROM forum_categories WHERE countryId = ?").all(countryId) as ForumCategory[];
  }

  async createCategory(data: Omit<ForumCategory, "id">): Promise<ForumCategory> {
    const id = crypto.randomUUID();
    getDb().prepare("INSERT INTO forum_categories (id, countryId, name, parentId) VALUES (?, ?, ?, ?)").run(id, data.countryId, data.name, data.parentId || null);
    return { id, ...data };
  }

  async getTopics(categoryId: string): Promise<ForumTopic[]> {
    return getDb().prepare("SELECT * FROM forum_topics WHERE categoryId = ? ORDER BY isPinned DESC, createdAt DESC").all(categoryId) as ForumTopic[];
  }

  async createTopic(data: Omit<ForumTopic, "id" | "createdAt">): Promise<ForumTopic> {
    const id = crypto.randomUUID();
    getDb().prepare("INSERT INTO forum_topics (id, categoryId, title, authorId, isPinned, status) VALUES (?, ?, ?, ?, ?, ?)").run(id, data.categoryId, data.title, data.authorId, data.isPinned ? 1 : 0, data.status);
    return getDb().prepare("SELECT * FROM forum_topics WHERE id = ?").get(id) as ForumTopic;
  }

  async updateTopicStatus(id: string, status: ForumTopic["status"]): Promise<void> {
    getDb().prepare("UPDATE forum_topics SET status = ? WHERE id = ?").run(status, id);
  }

  async getComments(topicId: string): Promise<ForumComment[]> {
    return getDb().prepare("SELECT * FROM forum_comments WHERE topicId = ? ORDER BY createdAt ASC").all(topicId) as ForumComment[];
  }

  async createComment(data: Omit<ForumComment, "id" | "createdAt">): Promise<ForumComment> {
    const id = crypto.randomUUID();
    getDb().prepare("INSERT INTO forum_comments (id, topicId, authorId, content) VALUES (?, ?, ?, ?)").run(id, data.topicId, data.authorId, data.content);
    return getDb().prepare("SELECT * FROM forum_comments WHERE id = ?").get(id) as ForumComment;
  }
}
