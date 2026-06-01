import crypto from "crypto";
import { getCollections, toDoc } from "./db";
import {
  INotificationRepository,
  Notification,
  CountrySubscription,
  TopicSubscription,
} from "../interfaces";

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

  async markReadOwned(id: string, userId: string): Promise<boolean> {
    const { notifications } = await getCollections();
    const result = await notifications.updateOne({ _id: id, userId }, { $set: { read: true } });
    return result.matchedCount > 0;
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

  async getUnreadCount(userId: string): Promise<number> {
    const { notifications } = await getCollections();
    return notifications.countDocuments({ userId, read: false });
  }

  // ── Country subscriptions ────────────────────────────────────────────────────

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

  // ── Topic subscriptions ──────────────────────────────────────────────────────

  async getTopicSubscriptions(userId: string): Promise<TopicSubscription[]> {
    const { userTopicSubscriptions, forumTopics } = await getCollections();
    const subs = await userTopicSubscriptions.find({ userId }).toArray();
    return Promise.all(
      subs.map(async (s) => {
        const topic = await forumTopics.findOne({ _id: s.topicId }, { projection: { title: 1 } });
        return {
          topicId: s.topicId,
          topicTitle: topic?.title ?? "",
          subscribed: true,
        };
      })
    );
  }

  async setTopicSubscription(userId: string, topicId: string, subscribed: boolean): Promise<void> {
    const { userTopicSubscriptions } = await getCollections();
    if (subscribed) {
      await userTopicSubscriptions.updateOne(
        { userId, topicId },
        { $setOnInsert: { userId, topicId } },
        { upsert: true }
      );
    } else {
      await userTopicSubscriptions.deleteOne({ userId, topicId });
    }
  }

  async isTopicSubscribed(userId: string, topicId: string): Promise<boolean> {
    const { userTopicSubscriptions } = await getCollections();
    const doc = await userTopicSubscriptions.findOne({ userId, topicId });
    return doc !== null;
  }

  async getTopicSubscriberIds(topicId: string): Promise<string[]> {
    const { userTopicSubscriptions } = await getCollections();
    const docs = await userTopicSubscriptions.find({ topicId }).toArray();
    return docs.map((d) => d.userId);
  }

  // ── Fan-out helpers ──────────────────────────────────────────────────────────

  async notifyCountrySubscribers(
    countryId: string,
    topicId: string,
    topicTitle: string,
    authorId: string
  ): Promise<void> {
    const { userCountrySubscriptions, forumCategories } = await getCollections();

    // Callers pass categoryId; resolve the actual countryId from the category
    const cat = await forumCategories.findOne({ _id: countryId });
    const resolvedCountryId = cat?.countryId ?? "";

    if (!resolvedCountryId) return;

    const subs = await userCountrySubscriptions.find({ countryId: resolvedCountryId }).toArray();
    const recipients = subs.map((s) => s.userId).filter((uid) => uid !== authorId);

    if (!recipients.length) return;

    const { notifications } = await getCollections();
    const now = new Date().toISOString();
    const docs = recipients.map((userId) => ({
      _id: crypto.randomUUID(),
      userId,
      type: "topic_new" as const,
      title: "Takip ettiğin ülkede yeni konu",
      message: topicTitle,
      targetType: "forum_topic" as const,
      targetId: topicId,
      read: false,
      createdAt: now,
    }));

    if (docs.length) await notifications.insertMany(docs);
  }

  async notifyTopicSubscribers(
    topicId: string,
    topicTitle: string,
    commenterName: string,
    commentAuthorId: string
  ): Promise<void> {
    const { userTopicSubscriptions, forumTopics } = await getCollections();

    const topic = await forumTopics.findOne({ _id: topicId });
    const authorId = topic?.authorId ?? null;

    const subs = await userTopicSubscriptions.find({ topicId }).toArray();
    const subIds = new Set(subs.map((s) => s.userId));

    // Also notify topic author if they didn't write this comment
    if (authorId && authorId !== commentAuthorId) {
      subIds.add(authorId);
    }

    const recipients = [...subIds].filter((uid) => uid !== commentAuthorId);
    if (!recipients.length) return;

    const { notifications } = await getCollections();
    const now = new Date().toISOString();
    const docs = recipients.map((userId) => ({
      _id: crypto.randomUUID(),
      userId,
      type: "new_comment" as const,
      title: userId === authorId ? "Konunuza yeni yorum geldi" : "Takip ettiğin konuya yeni yorum",
      message: `${commenterName}: ${topicTitle}`,
      targetType: "forum_topic" as const,
      targetId: topicId,
      read: false,
      createdAt: now,
    }));

    if (docs.length) await notifications.insertMany(docs);
  }

  // ── NTF-EVT-005: Staff fan-out ──────────────────────────────────────────────

  async createMany(items: Omit<Notification, "id" | "createdAt" | "read">[]): Promise<void> {
    if (!items.length) return;
    const { notifications } = await getCollections();
    const now = new Date().toISOString();
    const docs = items.map((n) => ({
      _id: crypto.randomUUID(),
      userId: n.userId,
      type: n.type,
      title: n.title,
      message: n.message,
      targetType: n.targetType ?? null,
      targetId: n.targetId ?? null,
      read: false,
      createdAt: now,
    }));
    await notifications.insertMany(docs);
  }

  async notifyStaffOfPendingTopic(
    topicId: string,
    topicTitle: string,
    authorName: string,
    staffUserIds: string[]
  ): Promise<void> {
    if (!staffUserIds.length) return;
    await this.createMany(
      staffUserIds.map((userId) => ({
        userId,
        type: "admin_new_pending" as const,
        title: "Yeni onay bekleyen konu",
        message: `${authorName}: "${topicTitle}"`,
        targetType: "admin_queue" as const,
        targetId: topicId,
      }))
    );
  }

  async notifyStaffOfDeletionRequest(
    topicId: string,
    topicTitle: string,
    requesterName: string,
    staffUserIds: string[]
  ): Promise<void> {
    if (!staffUserIds.length) return;
    await this.createMany(
      staffUserIds.map((userId) => ({
        userId,
        type: "admin_deletion_request" as const,
        title: "Konu silme talebi",
        message: `${requesterName} "${topicTitle}" konusunun silinmesini istedi`,
        targetType: "admin_queue" as const,
        targetId: topicId,
      }))
    );
  }

  async notifyStaffOfReport(
    targetType: "topic" | "comment",
    targetId: string,
    reason: string,
    reporterName: string,
    staffUserIds: string[]
  ): Promise<void> {
    if (!staffUserIds.length) return;
    const targetLabel = targetType === "topic" ? "konuyu" : "yorumu";
    await this.createMany(
      staffUserIds.map((userId) => ({
        userId,
        type: "admin_new_report" as const,
        title: "Yeni içerik raporu",
        message: `${reporterName} bir ${targetLabel} "${reason}" sebebiyle raporladı`,
        targetType: "admin_queue" as const,
        targetId,
      }))
    );
  }
}
