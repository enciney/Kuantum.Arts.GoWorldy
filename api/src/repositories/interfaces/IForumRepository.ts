export interface ForumCountry {
  id: string;
  name: string;
  code: string;
}

export interface ForumCategory {
  id: string;
  countryId: string;
  name: string;
  parentId?: string;
}

export interface ForumTopic {
  id: string;
  categoryId: string;
  title: string;
  authorId: string;
  isPinned: boolean;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
  commentCount: number;
}

export interface ForumComment {
  id: string;
  topicId: string;
  authorId: string;
  authorDisplayName: string;
  content: string;
  createdAt: string;
}

export interface ForumStats {
  totalTopics: number;
  totalComments: number;
  activeTopics: number;
  pendingTopics: number;
}

export interface IForumRepository {
  // Countries
  getCountries(): Promise<ForumCountry[]>;
  createCountry(data: Omit<ForumCountry, "id">): Promise<ForumCountry>;
  countCountries(): Promise<number>;

  // Categories
  getCategories(countryId: string): Promise<ForumCategory[]>;
  createCategory(data: Omit<ForumCategory, "id">): Promise<ForumCategory>;

  // Topics
  getTopics(categoryId: string): Promise<ForumTopic[]>;
  getPendingTopics(limit: number, offset: number): Promise<ForumTopic[]>;
  createTopic(data: Omit<ForumTopic, "id" | "createdAt" | "commentCount">): Promise<ForumTopic>;
  updateTopicStatus(id: string, status: ForumTopic["status"], reason?: string): Promise<void>;
  pinTopic(id: string, isPinned: boolean): Promise<void>;
  countTopics(): Promise<number>;

  // Comments
  getComments(topicId: string): Promise<ForumComment[]>;
  createComment(data: Omit<ForumComment, "id" | "createdAt" | "authorDisplayName">): Promise<ForumComment>;
  countComments(): Promise<number>;

  // Stats
  getStats(countryId?: string): Promise<ForumStats>;

  // User-scoped counts
  countTopicsByAuthor(userId: string): Promise<number>;
  countCommentsByAuthor(userId: string): Promise<number>;

  // Activity feed
  getRecentCommentsByAuthor(userId: string, limit: number): Promise<{
    id: string;
    content: string;
    topicId: string;
    topicTitle: string;
    createdAt: string;
  }[]>;
}
