import crypto from "crypto";
import { getDb } from "./db";
import { IGuideRepository, GuideStep, UserGuideProgress, GuideStats } from "../interfaces";

export class SqliteGuideRepository implements IGuideRepository {
  async getSteps(countryId: string): Promise<GuideStep[]> {
    return getDb().prepare('SELECT * FROM guide_steps WHERE countryId = ? ORDER BY "order" ASC').all(countryId) as GuideStep[];
  }

  async createStep(data: Omit<GuideStep, "id">): Promise<GuideStep> {
    const id = crypto.randomUUID();
    getDb().prepare('INSERT INTO guide_steps (id, countryId, "order", question, description) VALUES (?, ?, ?, ?, ?)').run(id, data.countryId, data.order, data.question, data.description || null);
    return { id, ...data };
  }

  async getUserProgress(userId: string): Promise<UserGuideProgress[]> {
    return getDb().prepare("SELECT * FROM user_guide_progress WHERE userId = ?").all(userId) as UserGuideProgress[];
  }

  async saveProgress(data: Omit<UserGuideProgress, "id" | "completedAt">): Promise<UserGuideProgress> {
    const id = crypto.randomUUID();
    getDb().prepare("INSERT INTO user_guide_progress (id, userId, stepId, answer) VALUES (?, ?, ?, ?)").run(id, data.userId, data.stepId, data.answer);
    return getDb().prepare("SELECT * FROM user_guide_progress WHERE id = ?").get(id) as UserGuideProgress;
  }

  async getStats(): Promise<GuideStats> {
    const totalSteps = getDb().prepare("SELECT COUNT(*) as count FROM guide_steps").get() as { count: number };
    const totalUsersWithProgress = getDb().prepare("SELECT COUNT(DISTINCT userId) as count FROM user_guide_progress").get() as { count: number };
    return {
      totalSteps: totalSteps.count,
      totalUsersWithProgress: totalUsersWithProgress.count,
      averageCompletion: 0,
    };
  }
}
