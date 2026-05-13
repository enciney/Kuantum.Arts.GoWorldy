import crypto from "crypto";
import { getDb } from "./db";
import { IGuideRepository, GuideStep, UserGuideProgress, GuideStats, UserGuideHomeStats } from "../interfaces";

export class SqliteGuideRepository implements IGuideRepository {
  async getSteps(countryId: string): Promise<GuideStep[]> {
    const rows = getDb()
      .prepare(`
        SELECT * FROM guide_steps
        WHERE (countryId = ? AND isGlobal = 0) OR isGlobal = 1
        ORDER BY isGlobal DESC, "order" ASC
      `)
      .all(countryId) as Array<Record<string, unknown>>;
    return rows.map((r) => ({
      ...(r as unknown as GuideStep),
      options: r.options ? JSON.parse(r.options as string) as string[] : undefined,
      isGlobal: r.isGlobal === 1,
    }));
  }

  async createStep(data: Omit<GuideStep, "id">): Promise<GuideStep> {
    const id = crypto.randomUUID();
    getDb()
      .prepare('INSERT INTO guide_steps (id, countryId, "order", question, description, blockingAnswer, options, faqUrl, isGlobal) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
      .run(
        id, data.countryId, data.order, data.question,
        data.description ?? null, data.blockingAnswer ?? null,
        data.options ? JSON.stringify(data.options) : null,
        data.faqUrl ?? null,
        data.isGlobal ? 1 : 0,
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

  async getUserProgressForCountry(userId: string, countryId: string): Promise<UserGuideProgress[]> {
    return getDb().prepare(`
      SELECT ugp.* FROM user_guide_progress ugp
      JOIN guide_steps gs ON ugp.stepId = gs.id
      WHERE ugp.userId = ? AND gs.countryId = ?
    `).all(userId, countryId) as unknown as UserGuideProgress[];
  }

  async resetAllChecklistProgress(userId: string, countryId: string): Promise<number> {
    const before = getDb().prepare(`
      SELECT COUNT(*) as count FROM user_guide_progress
      WHERE userId = ? AND stepId IN (
        SELECT id FROM guide_steps
        WHERE ((countryId = ? AND isGlobal = 0) OR isGlobal = 1)
          AND (stepType = 'checklist' OR stepType IS NULL)
      )
    `).get(userId, countryId) as unknown as { count: number };
    getDb().prepare(`
      DELETE FROM user_guide_progress
      WHERE userId = ? AND stepId IN (
        SELECT id FROM guide_steps
        WHERE ((countryId = ? AND isGlobal = 0) OR isGlobal = 1)
          AND (stepType = 'checklist' OR stepType IS NULL)
      )
    `).run(userId, countryId);
    return before.count;
  }

  async getUserCountryProgressCount(userId: string): Promise<number> {
    const result = getDb().prepare(`
      SELECT COUNT(DISTINCT gs.countryId) as count
      FROM user_guide_progress ugp
      JOIN guide_steps gs ON ugp.stepId = gs.id
      WHERE ugp.userId = ?
        AND gs.isGlobal = 0
        AND (gs.stepType = 'checklist' OR gs.stepType IS NULL)
    `).get(userId) as unknown as { count: number };
    return result.count;
  }

  async getUserHomeStats(userId: string, countryId: string): Promise<UserGuideHomeStats> {
    const country = getDb().prepare("SELECT * FROM forum_countries WHERE id = ?").get(countryId) as unknown as { id: string; name: string } | undefined;
    const totalSteps = getDb().prepare(`
      SELECT COUNT(*) as count FROM guide_steps
      WHERE ((countryId = ? AND isGlobal = 0) OR isGlobal = 1)
        AND (stepType = 'checklist' OR stepType IS NULL)
    `).get(countryId) as unknown as { count: number };
    const completedSteps = getDb().prepare(`
      SELECT COUNT(*) as count FROM user_guide_progress ugp
      JOIN guide_steps gs ON ugp.stepId = gs.id
      WHERE ugp.userId = ?
        AND ((gs.countryId = ? AND gs.isGlobal = 0) OR gs.isGlobal = 1)
        AND (gs.stepType = 'checklist' OR gs.stepType IS NULL)
        AND (gs.blockingAnswer IS NULL OR LOWER(TRIM(ugp.answer)) != LOWER(TRIM(gs.blockingAnswer)))
    `).get(userId, countryId) as unknown as { count: number };
    const countriesWithProgress = await this.getUserCountryProgressCount(userId);

    const total = totalSteps.count;
    const completed = completedSteps.count;

    return {
      countryId,
      countryName: country?.name ?? "",
      completedSteps: completed,
      totalSteps: total,
      completionPct: total > 0 ? Math.round((completed / total) * 100) : 0,
      countriesWithProgress,
    };
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
