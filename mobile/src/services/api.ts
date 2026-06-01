const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000/api";

export class ApiError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = "ApiError";
  }
}

let on401Handler: (() => void) | null = null;
export function setOn401Handler(handler: () => void) {
  on401Handler = handler;
}

async function request<T>(
  path: string,
  options: RequestInit & { token?: string } = {}
): Promise<T> {
  const { token, ...fetchOptions } = options;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(fetchOptions.headers as Record<string, string>),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, { ...fetchOptions, headers });
  const data = await res.json();
  if (!res.ok) {
    if (res.status === 401 && on401Handler) on401Handler();
    throw new ApiError(data.error || "Request failed", res.status);
  }
  return data as T;
}

export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  role: "admin" | "moderator" | "user";
  userType?: "emigrant" | "consultant" | "diaspora";
  credits?: number;
  isPremium?: boolean;
  premiumUntil?: string;
}

export interface AuthResponse {
  user: AuthUser;
  token: string;
  refreshToken?: string;
  isNewUser?: boolean;
}

export const api = {
  auth: {
    register: (body: {
      email: string;
      password: string;
      displayName: string;
      userType?: "emigrant" | "consultant" | "diaspora";
    }) =>
      request<AuthResponse>("/auth/register", {
        method: "POST",
        body: JSON.stringify(body),
      }),

    login: (body: { email: string; password: string }) =>
      request<AuthResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify(body),
      }),

    google: (idToken: string) =>
      request<AuthResponse>("/auth/google", {
        method: "POST",
        body: JSON.stringify({ idToken }),
      }),

    refresh: (refreshToken: string) =>
      request<{ token: string; refreshToken: string }>("/auth/refresh", {
        method: "POST",
        body: JSON.stringify({ refreshToken }),
      }),

    forgotPassword: (email: string) =>
      request<{ ok: boolean; message: string }>("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email }),
      }),

    resetPassword: (token: string, newPassword: string) =>
      request<{ ok: boolean; message: string }>("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ token, newPassword }),
      }),
  },

  users: {
    me: (token: string) =>
      request<{
        id: string;
        email: string;
        displayName: string;
        bio?: string;
        avatarUrl?: string;
        role: string;
        credits?: number;
        isPremium: boolean;
        premiumUntil?: string;
        userType?: "emigrant" | "consultant" | "diaspora";
        phoneNumber?: string;
        sharePhoneNumber?: boolean;
        activeGuideCountryId?: string;
      }>("/users/me", { token }),
    updateMe: (
      data: {
        displayName?: string;
        bio?: string;
        avatarUrl?: string;
        phoneNumber?: string;
        sharePhoneNumber?: number;
        userType?: "emigrant" | "consultant" | "diaspora";
        onboardingCompleted?: boolean;
        targetCountryId?: string;
        activeGuideCountryId?: string;
      },
      token: string
    ) =>
      request<{ id: string; email: string; displayName: string; bio?: string; avatarUrl?: string }>("/users/me", {
        method: "PATCH",
        body: JSON.stringify(data),
        token,
      }),
    myStats: (token: string) =>
      request<{
        topicCount: number;
        commentCount: number;
        followingCount: number;
        completedSteps: number;
      }>("/users/me/stats", { token }),

    myTopics: (token: string, limit = 20, offset = 0) =>
      request<{ id: string; title: string; status: string; isPinned: boolean; commentCount: number; createdAt: string }[]>(
        `/users/me/topics?limit=${limit}&offset=${offset}`,
        { token }
      ),

    myComments: (token: string, limit = 20, offset = 0) =>
      request<{ id: string; topicId: string; topicTitle: string; content: string; createdAt: string }[]>(
        `/users/me/comments?limit=${limit}&offset=${offset}`,
        { token }
      ),

    // FRM-TPC-008
    myFavorites: (token: string, limit = 20, offset = 0) =>
      request<{ id: string; title: string; content?: string; commentCount: number; createdAt: string }[]>(
        `/users/me/favorites?limit=${limit}&offset=${offset}`,
        { token }
      ),

    myActivity: (token: string) =>
      request<{
        type: "comment" | "guide";
        id: string;
        title: string;
        preview: string;
        targetId: string | null;
        createdAt: string;
      }[]>("/users/me/activity", { token }),

    consultants: (token?: string) =>
      request<{ id: string; displayName: string; bio?: string; avatarUrl?: string; userType: string }[]>(
        "/users/consultants",
        token ? { token } : {}
      ),

    consultant: (id: string, token?: string) =>
      request<{ id: string; displayName: string; bio?: string; avatarUrl?: string; userType: string }>(
        `/users/consultants/${id}`,
        token ? { token } : {}
      ),
  },

  forum: {
    getCountries: (token: string) =>
      request<{ id: string; name: string; code: string; topicCount?: number }[]>("/forum/countries", { token }),
    getCategories: (countryId: string, token: string) =>
      request<{ id: string; countryId: string; name: string; parentId?: string; topicCount?: number }[]>(
        `/forum/countries/${countryId}/categories`,
        { token }
      ),
    getTopics: (categoryId: string, token: string, page = 1, limit = 20) =>
      request<{ data: { id: string; title: string; authorId: string; isPinned: boolean; status: string; createdAt: string; commentCount: number; upvotes: number; hasUpvoted: boolean }[]; total: number; page: number; totalPages: number }>(
        `/forum/categories/${categoryId}/topics?page=${page}&limit=${limit}`,
        { token }
      ),
    // FRM-TPC-003: Tek konu detayı (content + favori durumu dahil)
    getTopic: (topicId: string, token?: string) =>
      request<{
        id: string;
        categoryId: string;
        title: string;
        content?: string;
        authorId: string;
        authorDisplayName?: string;
        status: string;
        isPinned: boolean;
        createdAt: string;
        editedAt?: string;
        upvotes?: number;
        hasUpvoted?: boolean;
        commentCount: number;
        favorited: boolean;
      }>(`/forum/topics/${topicId}`, token ? { token } : {}),
    getComments: (topicId: string, token?: string) =>
      request<{
        id: string;
        authorId: string;
        authorDisplayName: string;
        content: string;
        parentCommentId?: string | null;
        createdAt: string;
        editedAt?: string;
        deletedAt?: string;
        likesCount?: number;
        hasLiked?: boolean;
      }[]>(`/forum/topics/${topicId}/comments`, token ? { token } : {}),
    createComment: (topicId: string, content: string, token: string, parentCommentId?: string) =>
      request<{ id: string }>(`/forum/topics/${topicId}/comments`, {
        method: "POST",
        body: JSON.stringify({ content, ...(parentCommentId ? { parentCommentId } : {}) }),
        token,
      }),
    // FRM-CMT-003
    updateComment: (topicId: string, commentId: string, content: string, token: string) =>
      request<{ id: string; content: string; editedAt?: string }>(
        `/forum/topics/${topicId}/comments/${commentId}`,
        { method: "PATCH", body: JSON.stringify({ content }), token }
      ),
    // FRM-CMT-004
    deleteComment: (topicId: string, commentId: string, token: string) =>
      request<{ ok: boolean }>(`/forum/topics/${topicId}/comments/${commentId}`, {
        method: "DELETE",
        token,
      }),
    // FRM-CMT-005
    likeComment: (topicId: string, commentId: string, token: string) =>
      request<{ likes: number; hasLiked: boolean }>(
        `/forum/topics/${topicId}/comments/${commentId}/like`,
        { method: "POST", token }
      ),
    createTopic: (categoryId: string, title: string, token: string, content?: string) =>
      request<{ id: string; title: string; authorId: string; status: string }>("/forum/topics", {
        method: "POST",
        body: JSON.stringify({ categoryId, title, ...(content ? { content } : {}) }),
        token,
      }),
    // FRM-TPC-005: Staff doğrudan düzenler
    updateTopic: (topicId: string, data: { title?: string; content?: string }, token: string) =>
      request<{ id: string; title: string; content?: string; editedAt?: string }>(
        `/forum/topics/${topicId}`,
        { method: "PATCH", body: JSON.stringify(data), token }
      ),
    // FRM-TPC-005: Konu sahibi edit-request gönderir
    requestTopicEdit: (topicId: string, data: { title: string; content?: string }, token: string) =>
      request<{ id: string; status: string }>(
        `/forum/topics/${topicId}/edit-request`,
        { method: "POST", body: JSON.stringify(data), token }
      ),
    // FRM-TPC-006
    requestTopicDeletion: (topicId: string, reason: string, token: string) =>
      request<{ id: string; status: string }>(`/forum/topics/${topicId}/deletion-request`, {
        method: "POST",
        body: JSON.stringify({ reason }),
        token,
      }),
    getTopicDeletionRequest: (topicId: string, token: string) =>
      request<{ id: string; status: string; reason: string } | null>(
        `/forum/topics/${topicId}/deletion-request`,
        { token }
      ),
    // FRM-TPC-008
    toggleFavorite: (topicId: string, token: string) =>
      request<{ favorited: boolean }>(`/forum/topics/${topicId}/favorite`, {
        method: "POST",
        token,
      }),
    getFavoriteStatus: (topicId: string, token: string) =>
      request<{ favorited: boolean }>(`/forum/topics/${topicId}/favorite`, { token }),
    search: (q: string, countryId?: string) => {
      const params = new URLSearchParams({ q });
      if (countryId) params.set("countryId", countryId);
      return request<{ id: string; title: string; categoryName: string; countryName: string; createdAt: string; commentCount: number; upvotes?: number }[]>(
        `/forum/search?${params.toString()}`
      );
    },
    upvoteTopic: (topicId: string, token: string) =>
      request<{ upvotes: number; hasVoted: boolean }>(`/forum/topics/${topicId}/upvote`, {
        method: "POST",
        token,
      }),
  },

  reports: {
    // MOD-REP-001 / FRM-CMT-007
    create: (
      data: {
        targetType: "topic" | "comment";
        targetId: string;
        reason: "spam" | "abuse" | "misleading" | "copyright" | "other";
        description?: string;
      },
      token: string
    ) =>
      request<{ id: string; status: string }>("/reports", {
        method: "POST",
        body: JSON.stringify(data),
        token,
      }),
  },

  payment: {
    getPackages: () =>
      request<{
        premium: {
          id: string;
          name: string;
          description?: string;
          days: number;
          priceTL: number;
          features?: string[];
          isSubscription?: boolean;
          subscriptionDiscountPercent?: number;
        }[];
      }>("/payment/packages"),

    checkout: (params: { productType: string; priceId?: string; successUrl: string; cancelUrl: string }, token: string) =>
      request<{ url: string }>("/payment/checkout", {
        method: "POST",
        body: JSON.stringify(params),
        token,
      }),

    process: (productType: string, token: string, autoRenew?: boolean) =>
      request<{
        ok: boolean;
        isPremium: boolean;
        premiumUntil: string | null;
        autoRenew?: boolean;
        chargedTL?: number;
        discountPct?: number;
      }>(
        "/payment/process",
        { method: "POST", body: JSON.stringify({ productType, autoRenew: autoRenew === true }), token }
      ),

    myFeatures: (token: string) =>
      request<{ id: string; userId: string; featureType: string; purchasedAt: string; expiresAt: string | null }[]>(
        "/payment/my-features",
        { token }
      ),
  },

  notifications: {
    getAll: (token: string) =>
      request<{
        id: string;
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
      }[]>("/notifications", { token }),

    markRead: (id: string, token: string) =>
      request<{ ok: boolean }>(`/notifications/${id}/read`, {
        method: "PATCH",
        token,
      }),

    markAllRead: (token: string) =>
      request<{ ok: boolean }>("/notifications/read-all", {
        method: "PATCH",
        token,
      }),

    getSubscriptions: (token: string) =>
      request<{
        countryId: string;
        countryName: string;
        countryCode: string;
        subscribed: boolean;
      }[]>("/notifications/subscriptions", { token }),

    setSubscription: (countryId: string, subscribed: boolean, token: string) =>
      request<{ ok: boolean }>(`/notifications/subscriptions/${countryId}`, {
        method: "PATCH",
        body: JSON.stringify({ subscribed }),
        token,
      }),

    getUnreadCount: (token: string) =>
      request<{ count: number }>("/notifications/unread-count", { token }),
  },

  admin: {
    getDashboard: (token: string) =>
      request<{ stats: AdminDashboardStats }>("/admin/dashboard", { token }),

    getUsers: (token: string, search?: string) =>
      request<AdminUser[]>(
        `/admin/users${search ? `?search=${encodeURIComponent(search)}` : ""}`,
        { token }
      ),

    updateUserRole: (id: string, role: string, token: string) =>
      request<{ ok: boolean }>(`/admin/users/${id}/role`, {
        method: "PATCH",
        body: JSON.stringify({ role }),
        token,
      }),

    banUser: (id: string, banned: boolean, token: string) =>
      request<{ ok: boolean }>(`/admin/users/${id}/ban`, {
        method: "PATCH",
        body: JSON.stringify({ banned }),
        token,
      }),

    deleteUser: (id: string, token: string) =>
      request<{ ok: boolean }>(`/admin/users/${id}`, {
        method: "DELETE",
        token,
      }),

    getPendingTopics: (token: string) =>
      request<AdminTopic[]>("/admin/forum/pending", { token }),

    updateTopicStatus: (
      id: string,
      status: "approved" | "rejected",
      token: string,
      reason?: string
    ) =>
      request<{ ok: boolean }>(`/forum/topics/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status, reason }),
        token,
      }),

    getDeletionRequests: (token: string) =>
      request<DeletionRequest[]>("/admin/forum/deletion-requests", { token }),

    resolveDeletionRequest: (
      id: string,
      status: "approved" | "rejected",
      token: string,
      rejectionReason?: string
    ) =>
      request<{ ok: boolean }>(`/admin/forum/deletion-requests/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status, rejectionReason }),
        token,
      }),

    getEditRequests: (token: string) =>
      request<EditRequest[]>("/admin/forum/edit-requests", { token }),

    resolveEditRequest: (
      id: string,
      status: "approved" | "rejected",
      token: string,
      rejectionReason?: string
    ) =>
      request<{ ok: boolean }>(`/admin/forum/edit-requests/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status, rejectionReason }),
        token,
      }),

    getPremiumPlans: (token: string) =>
      request<PremiumPlan[]>("/admin/premium/plans", { token }),

    createPremiumPlan: (
      data: Omit<PremiumPlan, "id" | "createdAt">,
      token: string
    ) =>
      request<PremiumPlan>("/admin/premium/plans", {
        method: "POST",
        body: JSON.stringify(data),
        token,
      }),

    updatePremiumPlan: (
      id: string,
      data: Partial<PremiumPlan>,
      token: string
    ) =>
      request<{ ok: boolean }>(`/admin/premium/plans/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
        token,
      }),

    deletePremiumPlan: (id: string, token: string) =>
      request<{ ok: boolean }>(`/admin/premium/plans/${id}`, {
        method: "DELETE",
        token,
      }),

    getConfig: (token: string) =>
      request<AdminConfig>("/admin/config", { token }),

    getSettings: (token: string) =>
      request<SystemSettings>("/admin/settings", { token }),

    updateSettings: (data: Partial<SystemSettings>, token: string) =>
      request<{ ok: boolean }>("/admin/settings", {
        method: "PATCH",
        body: JSON.stringify(data),
        token,
      }),

    // Premium features catalog
    getPremiumFeatures: (token: string) =>
      request<PremiumFeature[]>("/admin/premium/features", { token }),

    createPremiumFeature: (data: Omit<PremiumFeature, "id" | "createdAt">, token: string) =>
      request<PremiumFeature>("/admin/premium/features", {
        method: "POST",
        body: JSON.stringify(data),
        token,
      }),

    updatePremiumFeature: (id: string, data: Partial<Omit<PremiumFeature, "id" | "createdAt">>, token: string) =>
      request<{ ok: boolean }>(`/admin/premium/features/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
        token,
      }),

    deletePremiumFeature: (id: string, token: string) =>
      request<{ ok: boolean }>(`/admin/premium/features/${id}`, {
        method: "DELETE",
        token,
      }),

    // Premium main feature categories
    getPremiumMainFeatures: (token: string) =>
      request<PremiumMainFeature[]>("/admin/premium/main-features", { token }),

    updatePremiumMainFeature: (id: string, data: Partial<Omit<PremiumMainFeature, "id" | "createdAt">>, token: string) =>
      request<{ ok: boolean }>(`/admin/premium/main-features/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
        token,
      }),

    // Premium users
    getPremiumUsers: (token: string) =>
      request<AdminUser[]>("/admin/premium/users", { token }),

    grantPremium: (userId: string, planId: string, token: string) =>
      request<{ ok: boolean; premiumUntil: string }>(`/admin/premium/users/${userId}/grant`, {
        method: "POST",
        body: JSON.stringify({ planId }),
        token,
      }),

    revokePremium: (userId: string, token: string) =>
      request<{ ok: boolean }>(`/admin/premium/users/${userId}/grant`, {
        method: "DELETE",
        token,
      }),
  },

  guide: {
    getSteps: (countryId: string, token: string) =>
      request<{
        id: string;
        order: number;
        question: string;
        description?: string;
        blockingAnswer?: string;
        options?: string[];
        faqUrl?: string;
        stepType?: "checklist" | "assessment";
        isGlobal?: boolean;
      }[]>(`/guide/steps/${countryId}`, { token }),
    getProgress: (token: string) =>
      request<{ id: string; stepId: string; answer: string; completedAt: string }[]>(
        "/guide/progress",
        { token }
      ),
    saveProgress: (stepId: string, answer: string, countryId: string, token: string) =>
      request<{ id: string }>("/guide/progress", {
        method: "POST",
        body: JSON.stringify({ stepId, answer, countryId }),
        token,
      }),
    getHomeStats: (token: string) =>
      request<{
        countryId: string | null;
        countryName: string;
        completedSteps: number;
        totalSteps: number;
        completionPct: number;
        countriesWithProgress: number;
      }>("/guide/home-stats", { token }),
  },
};

// ─── Admin types ─────────────────────────────────────────────────────────────

export interface AdminDashboardStats {
  totalUsers: number;
  totalTopics: number;
  totalComments: number;
  totalCountries: number;
}

export interface AdminUser {
  id: string;
  email: string;
  displayName: string;
  role: "admin" | "moderator" | "user";
  userType?: string;
  isPremium?: boolean;
  premiumUntil?: string;
  isBanned?: boolean;
  createdAt?: string;
}

export interface AdminTopic {
  id: string;
  title: string;
  status: string;
  authorId: string;
  authorDisplayName?: string;
  categoryId: string;
  categoryName?: string;
  countryName?: string;
  createdAt: string;
}

export interface DeletionRequest {
  id: string;
  topicId: string;
  topicTitle: string;
  requesterId: string;
  requesterName: string;
  reason: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
}

export interface EditRequest {
  id: string;
  topicId: string;
  topicTitle: string;
  requesterId: string;
  requesterName: string;
  newTitle: string;
  newContent?: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
}

export interface PremiumPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  durationDays: number;
  features: string[];
  featureKeys: string[];
  isSubscription: boolean;
  subscriptionDiscountPercent: number;
  isActive: boolean;
  createdAt: string;
}

export interface AdminConfig {
  app: { name: string; version: string; url: string };
  server: { port: number; nodeEnv: string; jwtExpiry: string };
  admin: { email: string };
  integrations: {
    firebaseConfigured: boolean;
    stripeConfigured: boolean;
    sendgridConfigured: boolean;
    googleAuthConfigured: boolean;
  };
}

export interface SystemSettings {
  forumCreateTopicCost: number;
  forumCommentAccessCost: number;
  commentEditWindowMinutes: number;
  commentDeleteWindowMinutes: number;
  guideEnableNotifications: boolean;
  guideEnableRecommendations: boolean;
  notificationsEnableEmail: boolean;
  notificationsEnableInApp: boolean;
}

export interface PremiumFeature {
  id: string;
  key: string;
  name: string;
  description: string;
  mainFeatureId?: string | null;
  durationDays?: number | null;
  quota?: number | null;
  isActive: boolean;
  createdAt: string;
}

export interface PremiumMainFeature {
  id: string;
  key: string;
  name: string;
  description: string;
  isActive: boolean;
  createdAt: string;
}
