import crypto from "crypto";
import { getCollections, toDoc } from "./db";
import { INotificationRepository, Notification, CountrySubscription } from "../interfaces";

export class MongoNotificationRepository implements INotificationRepository {
  async getForUser(userId: string, limit = 50): Promise<Notification[]> {
    const { notifications } = await getCollections();
    const docs = await notifications.find({ userId }).sort({ createdAt: -1 }).limit(limit).toArray();
    return docs.map((d) => toDoc<Notification>(d));
  }

  async markRead(id: string, userId: string): Promise<void> {
    const { notifications } = await getCollections();
    await notifications.updateOne({ _id: id, userId }, { $set: { read: true } });
  }

  async markAllRead(userId: string): Promise<void> {
    const { notifications } = await getCollections();
    await notifications.updateMany({ userId }, { $set: { read: true } });
  }

  async create(data: Omit<Notification, "id" | "createdAt" | "read">): Promise<Notification> {
    const { notifications } = await getCollections();
    const id = crypto.randomUUID();
    const doc = { _id: id, ...data, read: false, createdAt: new Date().toISOString() };
    await notifications.insertOne(doc);
    return toDoc<Notification>(doc);
  }

  async getSubscriptions(userId: string): Promise<CountrySubscription[]> {
    const { countries: countriesCol, userCountrySubscriptions } = await getCollections();
    const docs = await countriesCol.find({}).sort({ name: 1 }).toArray();
    const subs = await userCountrySubscriptions
      .find({ userId })
      .toArray()
      .then((s) => new Set(s.map((x) => x.countryId)));
    return docs.map((c) => ({
      countryId: c._id,
      countryName: c.name,
      countryCode: c.code,
      subscribed: subs.has(c._id),
    }));
  }

  async setSubscription(userId: string, countryId: string, subscribed: boolean): Promise<void> {
    const { userCountrySubscriptions } = await getCollections();
    if (subscribed) {
      await userCountrySubscriptions.updateOne(
        { userId, countryId },
        { $setOnInsert: { userId, countryId } },
        { upsert: true }
      );
    } else {
      await userCountrySubscriptions.deleteOne({ userId, countryId });
    }
  }
}
