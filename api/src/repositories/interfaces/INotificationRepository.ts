export interface Notification {
  id: string;
  userId: string;
  type:
    | "topic_approved"
    | "topic_rejected"
    | "comment_reply"
    | "system"
    | "topic_new"
    | "new_comment"
    | "comment_like"
    | "admin_new_pending"
    | "admin_deletion_request"
    | "admin_new_report"
    | "deletion_approved"
    | "deletion_rejected";
  title: string;
  message: string;
  targetType?: "forum_topic" | "admin_queue" | "forum_comment" | null;
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
  /** Returns true if the notification belonged to userId and was marked read; false if not found / not owned */
  markReadOwned(id: string, userId: string): Promise<boolean>;
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
  /** NTF-EVT-005: All admins & moderators get an in-app notification when a topic enters the pending queue. */
  notifyStaffOfPendingTopic(
    topicId: string,
    topicTitle: string,
    authorName: string,
    staffUserIds: string[]
  ): Promise<void>;
  /** Notify staff when a topic deletion request is created. */
  notifyStaffOfDeletionRequest(
    topicId: string,
    topicTitle: string,
    requesterName: string,
    staffUserIds: string[]
  ): Promise<void>;
  /** Notify staff when a content report is created. */
  notifyStaffOfReport(
    targetType: "topic" | "comment",
    targetId: string,
    reason: string,
    reporterName: string,
    staffUserIds: string[]
  ): Promise<void>;
  /** Bulk create notifications (used internally by fan-out helpers). */
  createMany(notifications: Omit<Notification, "id" | "createdAt" | "read">[]): Promise<void>;
}
