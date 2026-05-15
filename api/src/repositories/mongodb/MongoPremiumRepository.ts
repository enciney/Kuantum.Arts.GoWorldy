import crypto from "crypto";
import { getCollections, toDoc } from "./db";
import { IPremiumRepository, PremiumPlan } from "../interfaces/IPremiumRepository";
import { User } from "../interfaces/IUserRepository";

const DEFAULT_PLANS: Omit<PremiumPlan, "createdAt">[] = [
  {
    id: "premium_weekly",
    name: "Haftalık Premium",
    description: "7 günlük tam erişim",
    price: 50,
    durationDays: 7,
    features: ["Sınırsız konu açma", "Tüm yorumlara erişim", "Öncelikli destek"],
    isActive: true,
  },
  {
    id: "premium_monthly",
    name: "Aylık Premium",
    description: "30 günlük tam erişim — en avantajlı paket",
    price: 250,
    durationDays: 30,
    features: ["Sınırsız konu açma", "Reklamsız deneyim", "Tüm yorumlara erişim", "Öncelikli destek"],
    isActive: true,
  },
];

export class MongoPremiumRepository implements IPremiumRepository {
  async seedDefaultPlans(): Promise<void> {
    const { premiumPlans } = await getCollections();
    const existing = await premiumPlans.countDocuments();
    if (existing > 0) return;
    const now = new Date().toISOString();
    for (const plan of DEFAULT_PLANS) {
      await premiumPlans.updateOne(
        { _id: plan.id },
        { $setOnInsert: { ...plan, createdAt: now } },
        { upsert: true }
      );
    }
  }

  async getPlans(): Promise<PremiumPlan[]> {
    const { premiumPlans } = await getCollections();
    const docs = await premiumPlans.find({}).sort({ price: 1 }).toArray();
    return docs.map((d) => toDoc<PremiumPlan>(d));
  }

  async getPlanById(id: string): Promise<PremiumPlan | null> {
    const { premiumPlans } = await getCollections();
    const doc = await premiumPlans.findOne({ _id: id });
    return doc ? toDoc<PremiumPlan>(doc) : null;
  }

  async createPlan(data: Omit<PremiumPlan, "id" | "createdAt">): Promise<PremiumPlan> {
    const { premiumPlans } = await getCollections();
    const id = crypto.randomUUID();
    const doc = { _id: id, ...data, createdAt: new Date().toISOString() };
    await premiumPlans.insertOne(doc);
    return toDoc<PremiumPlan>(doc);
  }

  async updatePlan(id: string, data: Partial<Omit<PremiumPlan, "id" | "createdAt">>): Promise<void> {
    const { premiumPlans } = await getCollections();
    await premiumPlans.updateOne({ _id: id }, { $set: data });
  }

  async deletePlan(id: string): Promise<void> {
    const { premiumPlans } = await getCollections();
    await premiumPlans.deleteOne({ _id: id });
  }

  async getPremiumUsers(limit: number, offset: number): Promise<User[]> {
    const { users } = await getCollections();
    const docs = await users
      .find({ isPremium: true })
      .sort({ premiumUntil: 1 })
      .skip(offset)
      .limit(limit)
      .toArray();
    return docs.map((d) => toDoc<User>(d));
  }
}
