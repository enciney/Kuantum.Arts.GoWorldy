import crypto from "crypto";
import { getDb } from "./db";
import {
  INotificationRepository,
  Notification,
  CountrySubscription,
} from "../interfaces";

function toNotif(row: unknown): Notification {
  const r = row as Record<string, unknown>;
  return {
    ...r,
    read: r.read === 1 || r.read === true,
    targetType: (r.targetType as Notification["targetType"]) ?? null,
    targetId: (r.targetId as string) ?? null,
  } as Notification;
}

export class SqliteNotificationRepository implements INotificationRepository {
  async getForUser(userId: string, limit = 50): Promise<Notification[]> {
    return (
      getDb()
        .prepare(
          "SELECT * FROM notifications WHERE userId = ? ORDER BY createdAt DESC LIMIT ?"
        )
        .all(userId, limit) as unknown[]
    ).map(toNotif);
  }

  async markRead(id: string, userId: string): Promise<void> {
    getDb()
      .prepare("UPDATE notifications SET read = 1 WHERE id = ? AND userId = ?")
      .run(id, userId);
  }

  async markAllRead(userId: string): Promise<void> {
    getDb()
      .prepare("UPDATE notifications SET read = 1 WHERE userId = ?")
      .run(userId);
  }

  async create(
    data: Omit<Notification, "id" | "createdAt" | "read">
  ): Promise<Notification> {
    const id = crypto.randomUUID();
    getDb()
      .prepare(
        `INSERT INTO notifications (id, userId, type, title, message, targetType, targetId)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        id,
        data.userId,
        data.type,
        data.title,
        data.message,
        data.targetType ?? null,
        data.targetId ?? null
      );
    return toNotif(
      getDb().prepare("SELECT * FROM notifications WHERE id = ?").get(id)
    );
  }

  async getSubscriptions(userId: string): Promise<CountrySubscription[]> {
    return getDb()
      .prepare(
        `SELECT fc.id as countryId, fc.name as countryName, fc.code as countryCode,
                CASE WHEN ucs.countryId IS NOT NULL THEN 1 ELSE 0 END as subscribed
         FROM forum_countries fc
         LEFT JOIN user_country_subscriptions ucs
           ON ucs.countryId = fc.id AND ucs.userId = ?
         ORDER BY fc.name`
      )
      .all(userId)
      .map((r) => {
        const row = r as Record<string, unknown>;
        return {
          countryId: row.countryId as string,
          countryName: row.countryName as string,
          countryCode: row.countryCode as string,
          subscribed: row.subscribed === 1 || row.subscribed === true,
        } as CountrySubscription;
      });
  }

  async setSubscription(
    userId: string,
    countryId: string,
    subscribed: boolean
  ): Promise<void> {
    if (subscribed) {
      getDb()
        .prepare(
          "INSERT OR IGNORE INTO user_country_subscriptions (userId, countryId) VALUES (?, ?)"
        )
        .run(userId, countryId);
    } else {
      getDb()
        .prepare(
          "DELETE FROM user_country_subscriptions WHERE userId = ? AND countryId = ?"
        )
        .run(userId, countryId);
    }
  }
}
