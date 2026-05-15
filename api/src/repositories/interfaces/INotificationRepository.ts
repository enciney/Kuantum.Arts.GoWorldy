export interface Notification {
  id: string;
  userId: string;
  type: "topic_approved" | "topic_rejected" | "comment_reply" | "system" | "topic_new" | "new_comment";
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

export interface TopicSubscription {
  topicId: string;
  topicTitle: string;
  subscribed: boolean;
}

export interface INotificationRepository {
  getForUser(userId: string, limit?: number): Promise<Notification[]>;
  markRead(id: string, userId: string): Promise<void>;
  markAllRead(userId: string): Promise<void>;
  create(data: Omit<Notification, "id" | "createdAt" | "read">): Promise<Notification>;
  getUnreadCount(userId: string): Promise<number>;

  // Country subscriptions
  getSubscriptions(userId: string): Promise<CountrySubscription[]>;
  setSubscription(userId: string, countryId: string, subscribed: boolean): Promise<void>;

  // Topic subscriptions
  getTopicSubscriptions(userId: string): Promise<TopicSubscription[]>;
  setTopicSubscription(userId: string, topicId: string, subscribed: boolean): Promise<void>;
  isTopicSubscribed(userId: string, topicId: string): Promise<boolean>;
  getTopicSubscriberIds(topicId: string): Promise<string[]>;

  // Fan-out helpers
  notifyCountrySubscribers(
    countryId: string,
    topicId: string,
    topicTitle: string,
    authorId: string
  ): Promise<void>;
  notifyTopicSubscribers(
    topicId: string,
    topicTitle: string,
    commenterName: string,
    commentAuthorId: string
  ): Promise<void>;
}
