import crypto from "crypto";
import { getDb } from "./db";
import { IGuideRepository, GuideStep, UserGuideProgress, GuideStats } from "../interfaces";

export class SqliteGuideRepository implements IGuideRepository {
  async getSteps(countryId: string): Promise<GuideStep[]> {
    const rows = getDb()
      .prepare('SELECT * FROM guide_steps WHERE countryId = ? ORDER BY "order" ASC')
      .all(countryId) as Array<Record<string, unknown>>;
    return rows.map((r) => ({
      ...(r as unknown as GuideStep),
      options: r.options ? JSON.parse(r.options as string) as string[] : undefined,
    }));
  }

  async createStep(data: Omit<GuideStep, "id">): Promise<GuideStep> {
    const id = crypto.randomUUID();
    getDb()
      .prepare('INSERT INTO guide_steps (id, countryId, "order", question, description, blockingAnswer, options, faqUrl) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
      .run(
        id, data.countryId, data.order, data.question,
        data.description ?? null, data.blockingAnswer ?? null,
        data.options ? JSON.stringify(data.options) : null,
        data.faqUrl ?? null,
      );
    return { id, ...data };
  }

  async getUserProgress(userId: string): Promise<UserGuideProgress[]> {
    return getDb().prepare("SELECT * FROM user_guide_progress WHERE userId = ?").all(userId) as unknown as UserGuideProgress[];
  }

  async saveProgress(data: Omit<UserGuideProgress, "id" | "completedAt">): Promise<UserGuideProgress> {
    const id = crypto.randomUUID();
    getDb()
      .prepare(`
        INSERT INTO user_guide_progress (id, userId, stepId, answer)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(userId, stepId)
        DO UPDATE SET answer=excluded.answer, completedAt=datetime('now')
      `)
      .run(id, data.userId, data.stepId, data.answer);
    return getDb()
      .prepare("SELECT * FROM user_guide_progress WHERE userId = ? AND stepId = ?")
      .get(data.userId, data.stepId) as unknown as UserGuideProgress;
  }

  async getRecentProgress(userId: string, limit: number): Promise<{ stepId: string; question: string; answer: string; completedAt: string }[]> {
    return getDb()
      .prepare(`
        SELECT p.stepId, s.question, p.answer, p.completedAt
        FROM user_guide_progress p
        JOIN guide_steps s ON s.id = p.stepId
        WHERE p.userId = ?
        ORDER BY p.completedAt DESC
        LIMIT ?
      `)
      .all(userId, limit) as unknown as { stepId: string; question: string; answer: string; completedAt: string }[];
  }

  async getStats(): Promise<GuideStats> {
    const totalSteps = getDb().prepare("SELECT COUNT(*) as count FROM guide_steps").get() as unknown as { count: number };
    const totalUsersWithProgress = getDb().prepare("SELECT COUNT(DISTINCT userId) as count FROM user_guide_progress").get() as unknown as { count: number };
    return {
      totalSteps: totalSteps.count,
      totalUsersWithProgress: totalUsersWithProgress.count,
      averageCompletion: 0,
    };
  }
}
