import crypto from "crypto";
import { getCollections, toDoc } from "./db";
import { IUserFeatureRepository, UserFeature } from "../interfaces";

export class MongoUserFeatureRepository implements IUserFeatureRepository {
  async getUserFeatures(userId: string): Promise<UserFeature[]> {
    const { userFeatures } = await getCollections();
    const docs = await userFeatures.find({ userId }).sort({ purchasedAt: -1 }).toArray();
    return docs.map((d) => toDoc<UserFeature>(d));
  }

  async getActiveFeatures(userId: string): Promise<UserFeature[]> {
    const { userFeatures } = await getCollections();
    const now = new Date().toISOString();
    const docs = await userFeatures
      .find({
        userId,
        $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }],
      })
      .sort({ purchasedAt: -1 })
      .toArray();
    return docs.map((d) => toDoc<UserFeature>(d));
  }

  async hasFeature(userId: string, featureType: string): Promise<boolean> {
    const { userFeatures } = await getCollections();
    const now = new Date().toISOString();
    const doc = await userFeatures.findOne({
      userId,
      featureType,
      $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }],
    });
    return doc !== null;
  }

  async addFeature(userId: string, featureType: string, expiresAt: string | null): Promise<UserFeature> {
    const { userFeatures } = await getCollections();
    const id = crypto.randomUUID();
    const doc = {
      _id: id,
      userId,
      featureType,
      purchasedAt: new Date().toISOString(),
      expiresAt,
    };
    await userFeatures.insertOne(doc);
    return toDoc<UserFeature>(doc);
  }

  async removeFeature(userId: string, featureType: string): Promise<void> {
    const { userFeatures } = await getCollections();
    await userFeatures.deleteMany({ userId, featureType });
  }
}
