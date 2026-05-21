// PRM-FST-002: Ana Paket kategorileri — Konu Açma / Yorum / Mesajlaşma.
// PremiumFeature (instance) bu kategorilerden birini referans alır + durationDays + quota
// ekleyerek konkret bir özellik tanımlar.

export interface PremiumMainFeature {
  id: string;
  key: string;          // ör. "konu_acma", "yorum", "mesajlasma"
  name: string;         // ör. "Konu Açma Paketi"
  description: string;
  isActive: boolean;
  createdAt: string;
}

export interface IPremiumMainFeatureRepository {
  getAll(): Promise<PremiumMainFeature[]>;
  getActive(): Promise<PremiumMainFeature[]>;
  getById(id: string): Promise<PremiumMainFeature | null>;
  create(data: Omit<PremiumMainFeature, "id" | "createdAt">): Promise<PremiumMainFeature>;
  update(id: string, data: Partial<Omit<PremiumMainFeature, "id" | "createdAt">>): Promise<void>;
  delete(id: string): Promise<void>;
  seedDefaults(): Promise<void>;
}
