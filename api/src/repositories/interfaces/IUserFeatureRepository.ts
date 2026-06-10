export interface UserFeature {
  id: string;
  userId: string;
  featureType: string;
  purchasedAt: string;
  expiresAt: string | null;
}

export interface IUserFeatureRepository {
  getUserFeatures(userId: string): Promise<UserFeature[]>;
  getActiveFeatures(userId: string): Promise<UserFeature[]>;
  hasFeature(userId: string, featureType: string): Promise<boolean>;
  addFeature(userId: string, featureType: string, expiresAt: string | null): Promise<UserFeature>;
  removeFeature(userId: string, featureType: string): Promise<void>;
}
