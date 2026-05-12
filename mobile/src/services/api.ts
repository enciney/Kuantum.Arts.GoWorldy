const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000/api";

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
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data as T;
}

export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  role: "admin" | "moderator" | "user";
  userType?: "emigrant" | "consultant" | "diaspora";
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
        credits: number;
        isPremium: boolean;
        premiumUntil?: string;
        userType?: "emigrant" | "consultant" | "diaspora";
        phoneNumber?: string;
        sharePhoneNumber?: boolean;
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
      request<{ id: string; name: string; code: string }[]>("/forum/countries", { token }),
    getCategories: (countryId: string, token: string) =>
      request<{ id: string; countryId: string; name: string; parentId?: string }[]>(
        `/forum/countries/${countryId}/categories`,
        { token }
      ),
    getTopics: (categoryId: string, token: string) =>
      request<{ id: string; title: string; authorId: string; isPinned: boolean; status: string; createdAt: string; commentCount: number }[]>(
        `/forum/categories/${categoryId}/topics`,
        { token }
      ),
    getComments: (topicId: string, token: string) =>
      request<{ id: string; authorId: string; authorDisplayName: string; content: string; createdAt: string }[]>(
        `/forum/topics/${topicId}/comments`,
        { token }
      ),
    createComment: (topicId: string, content: string, token: string) =>
      request<{ id: string }>(`/forum/topics/${topicId}/comments`, {
        method: "POST",
        body: JSON.stringify({ content }),
        token,
      }),
    createTopic: (categoryId: string, title: string, token: string) =>
      request<{ id: string; status: string }>("/forum/topics", {
        method: "POST",
        body: JSON.stringify({ categoryId, title }),
        token,
      }),
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

  payment: {
    getPackages: () =>
      request<{
        credits: { id: string; name: string; credits: number; priceTL: number }[];
        premium: { id: string; name: string; days: number; priceTL: number }[];
      }>("/payment/packages"),

    checkout: (params: { productType: string; priceId?: string; successUrl: string; cancelUrl: string }, token: string) =>
      request<{ url: string }>("/payment/checkout", {
        method: "POST",
        body: JSON.stringify(params),
        token,
      }),
  },

  notifications: {
    getAll: (token: string) =>
      request<{
        id: string;
        type: "topic_approved" | "topic_rejected" | "comment_reply" | "system";
        title: string;
        message: string;
        targetType?: "forum_topic" | null;
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
      }[]>(`/guide/steps/${countryId}`, { token }),
    getProgress: (token: string) =>
      request<{ id: string; stepId: string; answer: string; completedAt: string }[]>(
        "/guide/progress",
        { token }
      ),
    saveProgress: (stepId: string, answer: string, token: string) =>
      request<{ id: string }>("/guide/progress", {
        method: "POST",
        body: JSON.stringify({ stepId, answer }),
        token,
      }),
  },
};
