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
  isPremium?: boolean;
  premiumUntil?: string;
}

export interface AuthResponse {
  user: AuthUser;
  token: string;
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
