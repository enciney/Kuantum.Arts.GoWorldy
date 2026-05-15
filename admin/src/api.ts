const BASE = "http://localhost:3000/api";

async function req<T>(path: string, opts: RequestInit = {}, token?: string): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(BASE + path, { ...opts, headers: { ...headers, ...(opts.headers as Record<string, string> || {}) } });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  auth: {
    login: (email: string, password: string) =>
      req<{ token: string; user: User }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      }),
  },
  admin: {
    dashboard: (token: string) =>
      req<{ stats: DashboardStats }>("/admin/dashboard", {}, token).then((r) => r.stats),
    users: (token: string) => req<User[]>("/admin/users", {}, token),
    updateUserRole: (id: string, role: string, token: string) =>
      req(`/admin/users/${id}/role`, { method: "PATCH", body: JSON.stringify({ role }) }, token),
    pendingTopics: (token: string) => req<Topic[]>("/admin/forum/pending", {}, token),
    forumStats: (token: string) => req<ForumStats>("/admin/forum/stats", {}, token),
    config: (token: string) => req<AdminConfig>("/admin/config", {}, token),
    // Premium plans
    getPremiumPlans: (token: string) => req<PremiumPlan[]>("/admin/premium/plans", {}, token),
    createPremiumPlan: (data: Omit<PremiumPlan, "id" | "createdAt">, token: string) =>
      req<PremiumPlan>("/admin/premium/plans", { method: "POST", body: JSON.stringify(data) }, token),
    updatePremiumPlan: (id: string, data: Partial<Omit<PremiumPlan, "id" | "createdAt">>, token: string) =>
      req<{ ok: boolean }>(`/admin/premium/plans/${id}`, { method: "PATCH", body: JSON.stringify(data) }, token),
    deletePremiumPlan: (id: string, token: string) =>
      req<{ ok: boolean }>(`/admin/premium/plans/${id}`, { method: "DELETE" }, token),
    // Premium users
    getPremiumUsers: (token: string) => req<User[]>("/admin/premium/users", {}, token),
    grantPremium: (userId: string, planId: string, token: string) =>
      req<{ ok: boolean; premiumUntil: string }>(`/admin/premium/users/${userId}/grant`, {
        method: "POST",
        body: JSON.stringify({ planId }),
      }, token),
    revokePremium: (userId: string, token: string) =>
      req<{ ok: boolean }>(`/admin/premium/users/${userId}/grant`, { method: "DELETE" }, token),
  },
  forum: {
    updateTopicStatus: (id: string, status: "approved" | "rejected", token: string, reason?: string) =>
      req(`/forum/topics/${id}/status`, { method: "PATCH", body: JSON.stringify({ status, reason }) }, token),
  },
};

export interface User {
  id: string;
  email: string;
  displayName: string;
  role: "admin" | "moderator" | "user";
  userType?: string;
  credits?: number;
  isPremium?: boolean;
  premiumUntil?: string;
  createdAt?: string;
}

export interface DashboardStats {
  totalUsers: number;
  totalTopics: number;
  totalComments: number;
  totalCountries: number;
}

export interface ForumStats {
  topicsByCountry: { countryName: string; topicCount: number }[];
  pendingTopics: number;
}

export interface AdminConfig {
  app: { name: string; version: string; url: string };
  forum: { createTopicCost: number; commentAccessCost: number; createAdCost: number; weeklyTopicReward: number };
  premium: { weeklyPrice: number; monthlyPrice: number };
  guide: { enableNotifications: boolean; enableRecommendations: boolean };
  notifications: { enableEmail: boolean; enableInApp: boolean };
}

export interface Topic {
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

export interface PremiumPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  durationDays: number;
  features: string[];
  isActive: boolean;
  createdAt: string;
}
