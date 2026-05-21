import crypto from "crypto";
import { getCollections, toDoc } from "./db";
import { IPremiumMainFeatureRepository, PremiumMainFeature } from "../interfaces/IPremiumMainFeatureRepository";

// PRM-FST-002: Ana paket kategorileri — 3 sabit kategori. Admin yenisini ekleyebilir,
// ama default'lar her zaman seed'lenir.
const DEFAULTS: Omit<PremiumMainFeature, "id" | "createdAt">[] = [
  { key: "konu_acma",   name: "Konu Açma Paketi",  description: "Forum'da yeni konu açma hakkı veren paket kategorisi.",        isActive: true },
  { key: "yorum",       name: "Yorum Paketi",      description: "Forum konularına yorum yazma hakkı veren paket kategorisi.",   isActive: true },
  { key: "mesajlasma",  name: "Mesajlaşma Paketi", description: "Diğer kullanıcılara direkt mesaj (DM) gönderme paket kategorisi.", isActive: true },
];

export class MongoPremiumMainFeatureRepository implements IPremiumMainFeatureRepository {
  async seedDefaults(): Promise<void> {
    const { premiumMainFeatures } = await getCollections();
    const now = new Date().toISOString();
    for (const f of DEFAULTS) {
      await premiumMainFeatures.updateOne(
        { key: f.key },
        { $setOnInsert: { _id: crypto.randomUUID(), ...f, createdAt: now } },
        { upsert: true }
      );
    }
  }

  async getAll(): Promise<PremiumMainFeature[]> {
    const { premiumMainFeatures } = await getCollections();
    const docs = await premiumMainFeatures.find({}).sort({ createdAt: 1 }).toArray();
    return docs.map((d) => toDoc<PremiumMainFeature>(d));
  }

  async getActive(): Promise<PremiumMainFeature[]> {
    const { premiumMainFeatures } = await getCollections();
    const docs = await premiumMainFeatures.find({ isActive: true }).sort({ createdAt: 1 }).toArray();
    return docs.map((d) => toDoc<PremiumMainFeature>(d));
  }

  async getById(id: string): Promise<PremiumMainFeature | null> {
    const { premiumMainFeatures } = await getCollections();
    const doc = await premiumMainFeatures.findOne({ _id: id });
    return doc ? toDoc<PremiumMainFeature>(doc) : null;
  }

  async create(data: Omit<PremiumMainFeature, "id" | "createdAt">): Promise<PremiumMainFeature> {
    const { premiumMainFeatures } = await getCollections();
    const id = crypto.randomUUID();
    const doc = { _id: id, ...data, createdAt: new Date().toISOString() };
    await premiumMainFeatures.insertOne(doc);
    return toDoc<PremiumMainFeature>(doc);
  }

  async update(id: string, data: Partial<Omit<PremiumMainFeature, "id" | "createdAt">>): Promise<void> {
    const { premiumMainFeatures } = await getCollections();
    await premiumMainFeatures.updateOne({ _id: id }, { $set: data });
  }

  async delete(id: string): Promise<void> {
    const { premiumMainFeatures } = await getCollections();
    await premiumMainFeatures.deleteOne({ _id: id });
  }
}
