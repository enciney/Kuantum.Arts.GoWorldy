export interface ForumCountry {
  id: string;
  name: string;
  code: string;
  topicCount?: number;
}

export interface ForumCategory {
  id: string;
  countryId: string;
  name: string;
  parentId?: string;
  topicCount?: number;
}

export interface ForumTopic {
  id: string;
  categoryId: string;
  title: string;
  content?: string;
  authorId: string;
  isPinned: boolean;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
  commentCount: number;
  upvotes?: number;
}

export interface ForumComment {
  id: string;
  topicId: string;
  authorId: string;
  authorDisplayName: string;
  content: string;
  createdAt: string;
}

export interface ForumSearchResult extends ForumTopic {
  categoryName: string;
  countryId: string;
  countryName: string;
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
  searchTopics(query: string, countryId?: string): Promise<ForumSearchResult[]>;
  getTopics(categoryId: string, options?: { onlyApproved?: boolean; page?: number; limit?: number }): Promise<{ data: ForumTopic[]; total: number; page: number; totalPages: number }>;
  getTopicById(id: string): Promise<ForumTopic | null>;
  getPendingTopics(limit: number, offset: number): Promise<ForumTopic[]>;
  createTopic(data: Omit<ForumTopic, "id" | "createdAt" | "commentCount">): Promise<ForumTopic>;
  updateTopicStatus(id: string, status: ForumTopic["status"], reason?: string): Promise<void>;
  pinTopic(id: string, isPinned: boolean): Promise<void>;
  countTopics(): Promise<number>;

  // Upvotes
  upvoteTopic(topicId: string, userId: string): Promise<{ upvotes: number; hasVoted: boolean }>;

  // Comments
  getComments(topicId: string): Promise<ForumComment[]>;
  createComment(data: Omit<ForumComment, "id" | "createdAt" | "authorDisplayName">): Promise<ForumComment>;
  countComments(): Promise<number>;

  // Stats
  getStats(countryId?: string): Promise<ForumStats>;

  // User-scoped counts
  countTopicsByAuthor(userId: string): Promise<number>;
  countCommentsByAuthor(userId: string): Promise<number>;

  // User-scoped lists
  getTopicsByAuthor(userId: string, limit: number, offset: number): Promise<ForumTopic[]>;
  getCommentsByAuthor(userId: string, limit: number, offset: number): Promise<{
    id: string;
    topicId: string;
    topicTitle: string;
    content: string;
    createdAt: string;
  }[]>;

  // Activity feed
  getRecentCommentsByAuthor(userId: string, limit: number): Promise<{
    id: string;
    content: string;
    topicId: string;
    topicTitle: string;
    createdAt: string;
  }[]>;
}
