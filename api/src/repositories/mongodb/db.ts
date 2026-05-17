import { MongoClient, Db, Collection } from "mongodb";
import { config } from "../../config";

// ── Collection name constants ────────────────────────────────────────────────

export const COLL = {
  USERS:                    "users",
  COUNTRIES:                "countries",
  FORUM_CATEGORIES:         "forumCategories",
  FORUM_TOPICS:             "forumTopics",
  FORUM_COMMENTS:           "forumComments",
  FORUM_TOPIC_UPVOTES:      "forumTopicUpvotes",
  GUIDE_STEPS:              "guideSteps",
  USER_GUIDE_PROGRESS:      "userGuideProgress",
  NOTIFICATIONS:            "notifications",
  USER_COUNTRY_SUBSCRIPTIONS: "userCountrySubscriptions",
  USER_TOPIC_SUBSCRIPTIONS: "userTopicSubscriptions",
  PREMIUM_PLANS:            "premiumPlans",
  USER_FEATURES:            "userFeatures",
} as const;

// ── Document schemas ─────────────────────────────────────────────────────────

export interface UserDoc {
  _id: string;
  email: string;
  passwordHash: string;
  displayName: string;
  bio?: string;
  role: "admin" | "moderator" | "user";
  userType: "emigrant" | "consultant" | "diaspora";
  credits: number;
  isPremium: boolean;
  premiumUntil?: string;
  phoneNumber?: string;
  sharePhoneNumber?: boolean;
  avatarUrl?: string;
  onboardingCompleted?: boolean;
  targetCountryId?: string;
  activeGuideCountryId?: string;
  createdAt: string;
}

export interface CountryDoc {
  _id: string;
  name: string;
  code: string;
}

export interface ForumCategoryDoc {
  _id: string;
  countryId: string;
  name: string;
  parentId?: string;
}

export interface ForumTopicDoc {
  _id: string;
  categoryId: string;
  title: string;
  authorId: string;
  isPinned: boolean;
  status: "pending" | "approved" | "rejected";
  rejectionReason?: string;
  createdAt: string;
}

export interface ForumCommentDoc {
  _id: string;
  topicId: string;
  authorId: string;
  content: string;
  createdAt: string;
}

export interface ForumTopicUpvoteDoc {
  topicId: string;
  userId: string;
  createdAt: string;
}

export interface GuideStepDoc {
  _id: string;
  countryId: string;
  order: number;
  question: string;
  description?: string | null;
  blockingAnswer?: string | null;
  options?: string[];
  faqUrl?: string | null;
  stepType?: "checklist" | "assessment";
  isGlobal?: boolean;
}

export interface UserGuideProgressDoc {
  _id: string;
  userId: string;
  stepId: string;
  answer: string;
  completedAt: string;
}

export interface NotificationDoc {
  _id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  targetType?: string | null;
  targetId?: string | null;
  read: boolean;
  createdAt: string;
}

export interface UserCountrySubscriptionDoc {
  userId: string;
  countryId: string;
}

export interface UserTopicSubscriptionDoc {
  userId: string;
  topicId: string;
}

export interface PremiumPlanDoc {
  _id: string;
  name: string;
  description: string;
  price: number;
  durationDays: number;
  features: string[];
  isActive: boolean;
  createdAt: string;
}

export interface UserFeatureDoc {
  _id: string;
  userId: string;
  featureType: string;
  purchasedAt: string;
  expiresAt: string | null;
}

// ── Collections return type ──────────────────────────────────────────────────

export interface AppCollections {
  users:                    Collection<UserDoc>;
  countries:                Collection<CountryDoc>;
  forumCategories:          Collection<ForumCategoryDoc>;
  forumTopics:              Collection<ForumTopicDoc>;
  forumComments:            Collection<ForumCommentDoc>;
  forumTopicUpvotes:        Collection<ForumTopicUpvoteDoc>;
  guideSteps:               Collection<GuideStepDoc>;
  userGuideProgress:        Collection<UserGuideProgressDoc>;
  notifications:            Collection<NotificationDoc>;
  userCountrySubscriptions: Collection<UserCountrySubscriptionDoc>;
  userTopicSubscriptions:   Collection<UserTopicSubscriptionDoc>;
  premiumPlans:             Collection<PremiumPlanDoc>;
  userFeatures:             Collection<UserFeatureDoc>;
}

// ── Connection ───────────────────────────────────────────────────────────────

let client: MongoClient | null = null;
let db: Db | null = null;

export async function getMongo(): Promise<Db> {
  if (!db) {
    client = new MongoClient(config.db.connectionString);
    await client.connect();
    db = client.db("goworldy");
    await ensureIndexes(db);
  }
  return db;
}

export async function getCollections(): Promise<AppCollections> {
  const d = await getMongo();
  return {
    users:                    d.collection<UserDoc>(COLL.USERS),
    countries:                d.collection<CountryDoc>(COLL.COUNTRIES),
    forumCategories:          d.collection<ForumCategoryDoc>(COLL.FORUM_CATEGORIES),
    forumTopics:              d.collection<ForumTopicDoc>(COLL.FORUM_TOPICS),
    forumComments:            d.collection<ForumCommentDoc>(COLL.FORUM_COMMENTS),
    forumTopicUpvotes:        d.collection<ForumTopicUpvoteDoc>(COLL.FORUM_TOPIC_UPVOTES),
    guideSteps:               d.collection<GuideStepDoc>(COLL.GUIDE_STEPS),
    userGuideProgress:        d.collection<UserGuideProgressDoc>(COLL.USER_GUIDE_PROGRESS),
    notifications:            d.collection<NotificationDoc>(COLL.NOTIFICATIONS),
    userCountrySubscriptions: d.collection<UserCountrySubscriptionDoc>(COLL.USER_COUNTRY_SUBSCRIPTIONS),
    userTopicSubscriptions:   d.collection<UserTopicSubscriptionDoc>(COLL.USER_TOPIC_SUBSCRIPTIONS),
    premiumPlans:             d.collection<PremiumPlanDoc>(COLL.PREMIUM_PLANS),
    userFeatures:             d.collection<UserFeatureDoc>(COLL.USER_FEATURES),
  };
}

async function ensureIndexes(d: Db): Promise<void> {
  await d.collection(COLL.USERS).createIndex({ email: 1 }, { unique: true });
  await d.collection(COLL.COUNTRIES).createIndex({ code: 1 }, { unique: true });
  await d.collection(COLL.COUNTRIES).createIndex({ name: 1 });
  await d.collection(COLL.FORUM_CATEGORIES).createIndex({ countryId: 1 });
  await d.collection(COLL.FORUM_TOPICS).createIndex({ categoryId: 1 });
  await d.collection(COLL.FORUM_TOPICS).createIndex({ authorId: 1 });
  await d.collection(COLL.FORUM_TOPICS).createIndex({ status: 1 });
  await d.collection(COLL.FORUM_COMMENTS).createIndex({ topicId: 1 });
  await d.collection(COLL.FORUM_COMMENTS).createIndex({ authorId: 1 });
  await d.collection(COLL.FORUM_TOPIC_UPVOTES).createIndex({ topicId: 1, userId: 1 }, { unique: true });
  await d.collection(COLL.GUIDE_STEPS).createIndex({ countryId: 1 });
  await d.collection(COLL.USER_GUIDE_PROGRESS).createIndex({ userId: 1, stepId: 1 }, { unique: true });
  await d.collection(COLL.NOTIFICATIONS).createIndex({ userId: 1, createdAt: -1 });
  await d.collection(COLL.USER_COUNTRY_SUBSCRIPTIONS).createIndex({ userId: 1, countryId: 1 }, { unique: true });
  await d.collection(COLL.USER_TOPIC_SUBSCRIPTIONS).createIndex({ userId: 1, topicId: 1 }, { unique: true });
  await d.collection(COLL.USER_TOPIC_SUBSCRIPTIONS).createIndex({ topicId: 1 });
  await d.collection(COLL.PREMIUM_PLANS).createIndex({ isActive: 1 });
  await d.collection(COLL.PREMIUM_PLANS).createIndex({ price: 1 });
  await d.collection(COLL.USER_FEATURES).createIndex({ userId: 1, featureType: 1 });
  await d.collection(COLL.USER_FEATURES).createIndex({ expiresAt: 1 });
}

// ── Test helpers ─────────────────────────────────────────────────────────────

export async function closeDbConnection(): Promise<void> {
  if (client) {
    await client.close();
    client = null;
    db = null;
  }
}

export function resetDbConnection(): void {
  client = null;
  db = null;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

export function toDoc<T extends { id: string }>(doc: { _id: unknown; [key: string]: unknown }): T {
  const { _id, ...rest } = doc;
  return { id: _id as unknown as string, ...rest } as unknown as T;
}
