export interface Notification {
  id: string;
  userId: string;
  type: "topic_approved" | "topic_rejected" | "comment_reply" | "system";
  title: string;
  message: string;
  targetType?: "forum_topic" | null;
  targetId?: string | null;
  read: boolean;
  createdAt: string;
}

export interface CountrySubscription {
  countryId: string;
  countryName: string;
  countryCode: string;
  subscribed: boolean;
}

export interface INotificationRepository {
  getForUser(userId: string, limit?: number): Promise<Notification[]>;
  markRead(id: string, userId: string): Promise<void>;
  markAllRead(userId: string): Promise<void>;
  create(data: Omit<Notification, "id" | "createdAt" | "read">): Promise<Notification>;
  getSubscriptions(userId: string): Promise<CountrySubscription[]>;
  setSubscription(userId: string, countryId: string, subscribed: boolean): Promise<void>;
}
