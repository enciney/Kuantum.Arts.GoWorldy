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
  hasUpvoted?: boolean;
  editedAt?: string;
  deletedAt?: string;
}

export interface ForumComment {
  id: string;
  topicId: string;
  authorId: string;
  authorDisplayName: string;
  content: string;
  parentCommentId?: string | null;
  createdAt: string;
  editedAt?: string;
  deletedAt?: string;
  likesCount?: number;
  hasLiked?: boolean;
}

export interface TopicDeletionRequest {
  id: string;
  topicId: string;
  topicTitle?: string;
  requesterId: string;
  requesterName?: string;
  reason: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
  resolvedBy?: string;
  resolvedAt?: string;
  rejectionReason?: string;
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
  getTopics(categoryId: string, options?: { onlyApproved?: boolean; page?: number; limit?: number; filter?: "popular" | "latest"; viewerId?: string }): Promise<{ data: ForumTopic[]; total: number; page: number; totalPages: number }>;
  getTopicById(id: string, viewerId?: string): Promise<ForumTopic | null>;
  getPendingTopics(limit: number, offset: number): Promise<ForumTopic[]>;
  createTopic(data: Omit<ForumTopic, "id" | "createdAt" | "commentCount">): Promise<ForumTopic>;
  updateTopicStatus(id: string, status: ForumTopic["status"], reason?: string): Promise<void>;
  updateTopic(id: string, data: { title?: string; content?: string }): Promise<void>;
  softDeleteTopic(id: string, deletedBy: string): Promise<void>;
  pinTopic(id: string, isPinned: boolean): Promise<void>;
  countTopics(): Promise<number>;

  // Upvotes
  upvoteTopic(topicId: string, userId: string): Promise<{ upvotes: number; hasVoted: boolean }>;

  // Favorites (FRM-TPC-008)
  toggleFavoriteTopic(topicId: string, userId: string): Promise<{ favorited: boolean }>;
  isTopicFavorited(topicId: string, userId: string): Promise<boolean>;
  getFavoritesByUser(userId: string, limit: number, offset: number): Promise<ForumTopic[]>;

  // Deletion requests (FRM-TPC-006)
  createDeletionRequest(data: { topicId: string; requesterId: string; reason: string }): Promise<TopicDeletionRequest>;
  getDeletionRequestByTopic(topicId: string): Promise<TopicDeletionRequest | null>;
  getPendingDeletionRequests(limit: number, offset: number): Promise<TopicDeletionRequest[]>;
  resolveDeletionRequest(id: string, status: "approved" | "rejected", resolvedBy: string, rejectionReason?: string): Promise<TopicDeletionRequest | null>;

  // Edit requests (FRM-TPC-005)
  createEditRequest(data: { topicId: string; requesterId: string; newTitle: string; newContent?: string }): Promise<{ id: string; status: string }>;
  getPendingEditRequests(limit: number, offset: number): Promise<unknown[]>;
  resolveEditRequest(id: string, status: "approved" | "rejected", resolvedBy: string, rejectionReason?: string): Promise<{ topicId: string; requesterId: string; newTitle: string; newContent?: string } | null>;

  // Comments
  getComments(topicId: string, viewerId?: string): Promise<ForumComment[]>;
  getCommentById(id: string): Promise<ForumComment | null>;
  createComment(data: Omit<ForumComment, "id" | "createdAt" | "authorDisplayName" | "likesCount" | "hasLiked">): Promise<ForumComment>;
  updateComment(id: string, content: string): Promise<void>;
  softDeleteComment(id: string, deletedBy: string): Promise<void>;
  toggleCommentLike(commentId: string, userId: string): Promise<{ likes: number; hasLiked: boolean }>;
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
