// PRM-FST-001: DB-driven premium feature catalog — admin tarafından yönetilir,
// premium planlar buradan özellik seçer.

export interface PremiumFeature {
  id: string;
  key: string;                  // Stabil identifier ör. "topic_pack_100_weekly"
  name: string;                 // UI başlığı (admin tarafından girilen ya da otomatik üretilen)
  description: string;          // Kullanıcıya görünen açıklama
  mainFeatureId?: string | null; // PRM-FST-002 ana paket referansı (konu_acma/yorum/mesajlasma)
  durationDays?: number | null;  // Süre (gün) — null = subscription planına göre değişir
  quota?: number | null;         // Hak sayısı — null = sınırsız
  isActive: boolean;
  createdAt: string;
}

export interface IPremiumFeatureRepository {
  getAll(): Promise<PremiumFeature[]>;
  getActive(): Promise<PremiumFeature[]>;
  getById(id: string): Promise<PremiumFeature | null>;
  create(data: Omit<PremiumFeature, "id" | "createdAt">): Promise<PremiumFeature>;
  update(id: string, data: Partial<Omit<PremiumFeature, "id" | "createdAt">>): Promise<void>;
  delete(id: string): Promise<void>;
  seedDefaults(): Promise<void>;
}
