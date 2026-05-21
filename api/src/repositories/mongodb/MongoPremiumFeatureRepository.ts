import crypto from "crypto";
import { getCollections, toDoc } from "./db";
import { IPremiumFeatureRepository, PremiumFeature } from "../interfaces/IPremiumFeatureRepository";

// PRM-FST-001: Varsayılan özellik kataloğu — her instance bir ana paket kategorisine
// (PRM-FST-002 — konu_acma/yorum/mesajlasma) bağlıdır + durationDays + quota tutar.
// quota=null → sınırsız.
//
// Backfill için: mainFeatureKey ile yazıyoruz; seedDefaults sırasında key → id'ye çeviriyoruz.
type DefaultFeatureSeed = Omit<PremiumFeature, "id" | "createdAt" | "mainFeatureId"> & {
  mainFeatureKey: string | null;
};

const DEFAULTS: DefaultFeatureSeed[] = [
  // Tek seferlik instance'lar
  { key: "topic_pack_10_weekly",      name: "Haftada 10 konu açma hakkı", description: "1 hafta boyunca 10 adet konu açma hakkı.",                  mainFeatureKey: "konu_acma",   durationDays: 7, quota: 10,   isActive: true },
  { key: "unlimited_comments_weekly", name: "1 hafta sınırsız yorum",     description: "1 hafta boyunca sınırsız yorum yazma hakkı.",                mainFeatureKey: "yorum",       durationDays: 7, quota: null, isActive: true },
  { key: "dm_5_weekly",               name: "1 hafta 5 DM hakkı",         description: "1 hafta boyunca 5 direkt mesaj gönderme hakkı.",             mainFeatureKey: "mesajlasma",  durationDays: 7, quota: 5,    isActive: true },
  // Premium subscription'a özel
  { key: "unlimited_topics",          name: "Sınırsız konu açma",         description: "Premium süresince istediğin kadar konu açma hakkı.",         mainFeatureKey: "konu_acma",   durationDays: 7, quota: null, isActive: true },
  { key: "dm_20_weekly",              name: "Haftada 20 DM hakkı",        description: "Her hafta 20 direkt mesaj gönderme hakkı.",                  mainFeatureKey: "mesajlasma",  durationDays: 7, quota: 20,   isActive: true },
  // Genel
  { key: "comment_access",            name: "Tüm yorumlara erişim",       description: "Kilitli yorumları okuma hakkı.",                             mainFeatureKey: null,          durationDays: null, quota: null, isActive: true },
];

const LEGACY_KEYS = ["ad_free", "priority_support", "unlimited_dm", "early_access"];
const REACTIVATE_KEYS = ["unlimited_topics"];

export class MongoPremiumFeatureRepository implements IPremiumFeatureRepository {
  async seedDefaults(): Promise<void> {
    const { premiumFeatures, premiumMainFeatures } = await getCollections();
    const now = new Date().toISOString();

    // mainFeature key → id eşlemesi
    const mainFeatures = await premiumMainFeatures.find({}).toArray();
    const keyToId = new Map<string, string>();
    for (const mf of mainFeatures) keyToId.set(mf.key, mf._id);

    // Yapı değişimi: priority_support, ad_free vb. legacy key'leri deaktif et.
    await premiumFeatures.updateMany(
      { key: { $in: LEGACY_KEYS } },
      { $set: { isActive: false } }
    );

    // Yanlışlıkla deaktif edilmiş key'leri yeniden aktive et
    await premiumFeatures.updateMany(
      { key: { $in: REACTIVATE_KEYS } },
      { $set: { isActive: true } }
    );

    // Yeni katalog feature'larını upsert et (admin değişikliklerini koru — $setOnInsert),
    // ancak mainFeatureId / durationDays / quota alanları eksikse backfill et.
    for (const f of DEFAULTS) {
      const { mainFeatureKey, ...rest } = f;
      const mainFeatureId = mainFeatureKey ? keyToId.get(mainFeatureKey) ?? null : null;
      await premiumFeatures.updateOne(
        { key: f.key },
        {
          $setOnInsert: {
            _id: crypto.randomUUID(),
            ...rest,
            mainFeatureId,
            createdAt: now,
          },
        },
        { upsert: true }
      );
      // Eski seed'lerin mainFeatureId / durationDays / quota alanlarını backfill et
      const existing = await premiumFeatures.findOne({ key: f.key });
      if (existing) {
        const patch: Record<string, unknown> = {};
        if (existing.mainFeatureId === undefined) patch.mainFeatureId = mainFeatureId;
        if (existing.durationDays === undefined) patch.durationDays = f.durationDays ?? null;
        if (existing.quota === undefined) patch.quota = f.quota ?? null;
        if (Object.keys(patch).length > 0) {
          await premiumFeatures.updateOne({ key: f.key }, { $set: patch });
        }
      }
    }
  }

  async getAll(): Promise<PremiumFeature[]> {
    const { premiumFeatures } = await getCollections();
    const docs = await premiumFeatures.find({}).sort({ createdAt: 1 }).toArray();
    return docs.map((d) => toDoc<PremiumFeature>(d));
  }

  async getActive(): Promise<PremiumFeature[]> {
    const { premiumFeatures } = await getCollections();
    const docs = await premiumFeatures.find({ isActive: true }).sort({ createdAt: 1 }).toArray();
    return docs.map((d) => toDoc<PremiumFeature>(d));
  }

  async getById(id: string): Promise<PremiumFeature | null> {
    const { premiumFeatures } = await getCollections();
    const doc = await premiumFeatures.findOne({ _id: id });
    return doc ? toDoc<PremiumFeature>(doc) : null;
  }

  async create(data: Omit<PremiumFeature, "id" | "createdAt">): Promise<PremiumFeature> {
    const { premiumFeatures } = await getCollections();
    const id = crypto.randomUUID();
    const doc = { _id: id, ...data, createdAt: new Date().toISOString() };
    await premiumFeatures.insertOne(doc);
    return toDoc<PremiumFeature>(doc);
  }

  async update(id: string, data: Partial<Omit<PremiumFeature, "id" | "createdAt">>): Promise<void> {
    const { premiumFeatures } = await getCollections();
    await premiumFeatures.updateOne({ _id: id }, { $set: data });
  }

  async delete(id: string): Promise<void> {
    const { premiumFeatures } = await getCollections();
    await premiumFeatures.deleteOne({ _id: id });
  }
}
