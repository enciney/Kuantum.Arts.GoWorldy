import crypto from "crypto";
import { getCollections, toDoc } from "./db";
import { IGuideRepository, GuideStep, UserGuideProgress, GuideStats, UserGuideHomeStats } from "../interfaces";

export class MongoGuideRepository implements IGuideRepository {
  async getSteps(countryId: string): Promise<GuideStep[]> {
    const { guideSteps } = await getCollections();
    const docs = await guideSteps
      .find({ $or: [{ countryId, isGlobal: false }, { isGlobal: true }] })
      .sort({ isGlobal: -1, order: 1 })
      .toArray();
    return docs.map((d) => toDoc<GuideStep>(d));
  }

  async createStep(data: Omit<GuideStep, "id">): Promise<GuideStep> {
    const { guideSteps } = await getCollections();
    const id = crypto.randomUUID();
    await guideSteps.insertOne({ _id: id, ...data });
    return { id, ...data };
  }

  async getUserProgress(userId: string): Promise<UserGuideProgress[]> {
    const { userGuideProgress } = await getCollections();
    const docs = await userGuideProgress.find({ userId }).toArray();
    return docs.map((d) => toDoc<UserGuideProgress>(d));
  }

  async getUserProgressForCountry(userId: string, countryId: string): Promise<UserGuideProgress[]> {
    const { guideSteps, userGuideProgress } = await getCollections();
    const stepIds = await guideSteps
      .find({ countryId }, { projection: { _id: 1 } })
      .toArray()
      .then((s) => s.map((x) => x._id));
    const docs = await userGuideProgress.find({ userId, stepId: { $in: stepIds } }).toArray();
    return docs.map((d) => toDoc<UserGuideProgress>(d));
  }

  async saveProgress(data: Omit<UserGuideProgress, "id" | "completedAt">): Promise<UserGuideProgress> {
    const { userGuideProgress } = await getCollections();
    const now = new Date().toISOString();
    const result = await userGuideProgress.findOneAndUpdate(
      { userId: data.userId, stepId: data.stepId },
      {
        $set: { answer: data.answer, completedAt: now },
        $setOnInsert: { _id: crypto.randomUUID(), userId: data.userId, stepId: data.stepId },
      },
      { upsert: true, returnDocument: "after" }
    );
    return toDoc<UserGuideProgress>(result as any);
  }

  async resetAllChecklistProgress(userId: string, countryId: string): Promise<number> {
    const { guideSteps, userGuideProgress } = await getCollections();
    const stepIds = await guideSteps
      .find({
        $and: [
          { $or: [{ countryId, isGlobal: false }, { isGlobal: true }] },
          { $or: [{ stepType: "checklist" }, { stepType: { $exists: false } }] },
        ],
      } as any)
      .toArray()
      .then((s) => s.map((x) => x._id));
    const { deletedCount } = await userGuideProgress.deleteMany({ userId, stepId: { $in: stepIds } });
    return deletedCount ?? 0;
  }

  async getUserCountryProgressCount(userId: string): Promise<number> {
    const { userGuideProgress, guideSteps } = await getCollections();
    const progress = await userGuideProgress.find({ userId }).toArray();
    const stepIds = progress.map((p) => p.stepId);
    const steps = await guideSteps.find({ _id: { $in: stepIds }, isGlobal: false }).toArray();
    const countries = new Set(steps.map((s) => s.countryId));
    return countries.size;
  }

  async getUserHomeStats(userId: string, countryId: string): Promise<UserGuideHomeStats> {
    const { guideSteps, userGuideProgress, countries: countriesCol } = await getCollections();

    const country = await countriesCol.findOne({ _id: countryId });

    const allSteps = await guideSteps
      .find({
        $and: [
          { $or: [{ countryId, isGlobal: false }, { isGlobal: true }] },
          { $or: [{ stepType: "checklist" }, { stepType: { $exists: false } }] },
        ],
      } as any)
      .toArray();

    const stepIds = allSteps.map((s) => s._id);
    const stepMap = new Map(allSteps.map((s) => [s._id, s]));

    const progress = await userGuideProgress
      .find({ userId, stepId: { $in: stepIds } })
      .toArray();

    const completed = progress.filter((p) => {
      const step = stepMap.get(p.stepId);
      if (!step?.blockingAnswer) return true;
      return p.answer.trim().toLowerCase() !== step.blockingAnswer.trim().toLowerCase();
    }).length;

    const countriesWithProgress = await this.getUserCountryProgressCount(userId);

    return {
      countryId,
      countryName: country?.name ?? "",
      completedSteps: completed,
      totalSteps: allSteps.length,
      completionPct: allSteps.length > 0 ? Math.round((completed / allSteps.length) * 100) : 0,
      countriesWithProgress,
    };
  }

  async getRecentProgress(userId: string, limit: number): Promise<{ stepId: string; question: string; answer: string; completedAt: string }[]> {
    const { userGuideProgress, guideSteps } = await getCollections();
    const progress = await userGuideProgress
      .find({ userId })
      .sort({ completedAt: -1 })
      .limit(limit)
      .toArray();
    return Promise.all(
      progress.map(async (p) => {
        const step = await guideSteps.findOne({ _id: p.stepId });
        return {
          stepId: p.stepId,
          question: step?.question ?? "",
          answer: p.answer,
          completedAt: p.completedAt,
        };
      })
    );
  }

  async getStats(): Promise<GuideStats> {
    const { guideSteps, userGuideProgress } = await getCollections();
    const [totalSteps, usersAgg] = await Promise.all([
      guideSteps.countDocuments(),
      userGuideProgress.aggregate([{ $group: { _id: "$userId" } }, { $count: "total" }]).toArray(),
    ]);
    return {
      totalSteps,
      totalUsersWithProgress: (usersAgg[0] as any)?.total ?? 0,
      averageCompletion: 0,
    };
  }
}
