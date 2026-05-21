import crypto from "crypto";
import { getCollections } from "./db";
import { IPremiumRepository, PremiumPlan } from "../interfaces/IPremiumRepository";
import { User } from "../interfaces/IUserRepository";

// PRM-PKG-* — Paket yapısı:
//   Tek seferlik: topic_pack_weekly, comment_pack_weekly, dm_pack_weekly (her biri 99 TL, 7 gün)
//   Subscription: premium_weekly (179 TL/hf), premium_monthly (279 TL/ay) — autoRenew %15 indirim
//     İçerik: sınırsız konu açma + sınırsız yorum + haftada 20 DM
const DEFAULT_PLANS: Omit<PremiumPlan, "createdAt">[] = [
  {
    id: "topic_pack_weekly",
    name: "Konu Açma Paketi",
    description: "Tek seferlik — 1 hafta boyunca 10 adet konu açma hakkı.",
    price: 99,
    durationDays: 7,
    features: ["Haftada 10 konu açma hakkı"],
    featureKeys: ["topic_pack_10_weekly"],
    isSubscription: false,
    subscriptionDiscountPercent: 0,
    isActive: true,
  },
  {
    id: "comment_pack_weekly",
    name: "Yorum Paketi",
    description: "Tek seferlik — 1 hafta boyunca sınırsız yorum yazma hakkı.",
    price: 99,
    durationDays: 7,
    features: ["1 hafta sınırsız yorum"],
    featureKeys: ["unlimited_comments_weekly"],
    isSubscription: false,
    subscriptionDiscountPercent: 0,
    isActive: true,
  },
  {
    id: "dm_pack_weekly",
    name: "Mesajlaşma Paketi",
    description: "Tek seferlik — 1 hafta boyunca 5 direkt mesaj hakkı.",
    price: 99,
    durationDays: 7,
    features: ["1 hafta 5 DM hakkı"],
    featureKeys: ["dm_5_weekly"],
    isSubscription: false,
    subscriptionDiscountPercent: 0,
    isActive: true,
  },
];

// Subscription planları — seed sırasında forcibly upsert edilir (bundle yapısından
// dönüş olduğu için legacy DB içerikleri override edilmeli).
const SUBSCRIPTION_PLANS: Omit<PremiumPlan, "createdAt">[] = [
  {
    id: "premium_weekly",
    name: "Haftalık Premium",
    description: "Haftalık abonelik — sınırsız konu açma, sınırsız yorum ve haftada 20 DM. AutoRenew %15 indirimli.",
    price: 179,
    durationDays: 7,
    features: ["Sınırsız konu açma", "Sınırsız yorum", "Haftada 20 DM hakkı"],
    featureKeys: ["unlimited_topics", "unlimited_comments_weekly", "dm_20_weekly"],
    isSubscription: true,
    subscriptionDiscountPercent: 15,
    isActive: true,
  },
  {
    id: "premium_monthly",
    name: "Aylık Premium",
    description: "Aylık abonelik — sınırsız konu açma, sınırsız yorum ve haftada 20 DM. AutoRenew %15 indirimli.",
    price: 279,
    durationDays: 30,
    features: ["Sınırsız konu açma", "Sınırsız yorum", "Haftada 20 DM hakkı"],
    featureKeys: ["unlimited_topics", "unlimited_comments_weekly", "dm_20_weekly"],
    isSubscription: true,
    subscriptionDiscountPercent: 15,
    isActive: true,
  },
];

// Eski bundle yapısından kalan planlar — deaktif et (kullanıcının canlı satın alımı varsa
// premiumUntil korunsun, sadece satın alma listelerinden düşsün).
const LEGACY_PLAN_IDS = ["bundle_weekly", "bundle_monthly"];

function docToPlan(doc: { _id: unknown; [key: string]: unknown }): PremiumPlan {
  const { _id, ...rest } = doc;
  const r = rest as Partial<PremiumPlan>;
  return {
    id: _id as string,
    name: r.name ?? "",
    description: r.description ?? "",
    price: r.price ?? 0,
    durationDays: r.durationDays ?? 0,
    features: r.features ?? [],
    featureKeys: r.featureKeys ?? [],
    isSubscription: r.isSubscription ?? false,
    subscriptionDiscountPercent: r.subscriptionDiscountPercent ?? 0,
    isActive: r.isActive ?? false,
    createdAt: r.createdAt ?? "",
  };
}

export class MongoPremiumRepository implements IPremiumRepository {
  async seedDefaultPlans(): Promise<void> {
    const { premiumPlans } = await getCollections();
    const now = new Date().toISOString();

    // Eski bundle planlarını deaktif et
    await premiumPlans.updateMany(
      { _id: { $in: LEGACY_PLAN_IDS } },
      { $set: { isActive: false } }
    );

    // Tüm planlardan "Öncelikli destek" ve "Reklamsız deneyim" feature stringlerini kaldır
    await premiumPlans.updateMany(
      {},
      { $pull: { features: { $in: ["Öncelikli destek", "Reklamsız deneyim"] } } }
    );

    // Tek seferlik paketleri upsert et (admin değişikliklerini koru — $setOnInsert)
    for (const plan of DEFAULT_PLANS) {
      await premiumPlans.updateOne(
        { _id: plan.id },
        { $setOnInsert: { ...plan, createdAt: now } },
        { upsert: true }
      );
    }

    // Subscription planları forcibly upsert et — bundle yapısından dönüş için
    // legacy DB içeriklerini override etmek gerekiyor. createdAt korunur.
    for (const plan of SUBSCRIPTION_PLANS) {
      const existing = await premiumPlans.findOne({ _id: plan.id });
      const createdAt = existing?.createdAt ?? now;
      await premiumPlans.updateOne(
        { _id: plan.id },
        { $set: { ...plan, createdAt } },
        { upsert: true }
      );
    }
  }

  async getPlans(): Promise<PremiumPlan[]> {
    const { premiumPlans } = await getCollections();
    const docs = await premiumPlans.find({}).sort({ isSubscription: 1, price: 1 }).toArray();
    return docs.map(docToPlan);
  }

  async getPlanById(id: string): Promise<PremiumPlan | null> {
    const { premiumPlans } = await getCollections();
    const doc = await premiumPlans.findOne({ _id: id });
    return doc ? docToPlan(doc) : null;
  }

  async createPlan(data: Omit<PremiumPlan, "id" | "createdAt">): Promise<PremiumPlan> {
    const { premiumPlans } = await getCollections();
    const id = crypto.randomUUID();
    const doc = { _id: id, ...data, createdAt: new Date().toISOString() };
    await premiumPlans.insertOne(doc);
    return docToPlan(doc);
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
    return docs.map((d) => {
      const { _id, ...rest } = d;
      return { id: _id, ...rest } as unknown as User;
    });
  }
}
