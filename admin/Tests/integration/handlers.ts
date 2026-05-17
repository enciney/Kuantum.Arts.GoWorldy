import { http, HttpResponse } from "msw";
import type { User, DashboardStats, Topic, PremiumPlan, AdminConfig } from "../../src/api";

const BASE = "http://localhost:3000/api";

// ── Shared fixtures ──────────────────────────────────────────────────────────

export const adminUser: User = {
  id: "admin-1",
  email: "admin@goworldy.com",
  displayName: "Admin User",
  role: "admin",
  credits: 100,
  isPremium: false,
  createdAt: "2024-01-01T00:00:00Z",
};

export const regularUser: User = {
  id: "user-1",
  email: "user@test.com",
  displayName: "Normal Kullanıcı",
  role: "user",
  credits: 50,
  isPremium: false,
  createdAt: "2024-02-01T00:00:00Z",
};

export const premiumUser: User = {
  id: "user-2",
  email: "premium@test.com",
  displayName: "Premium Kullanıcı",
  role: "user",
  credits: 200,
  isPremium: true,
  premiumUntil: "2025-01-01T00:00:00Z",
  createdAt: "2024-01-15T00:00:00Z",
};

export const dashboardStats: DashboardStats = {
  totalUsers: 142,
  totalTopics: 38,
  totalComments: 276,
  totalCountries: 12,
};

export const pendingTopics: Topic[] = [
  {
    id: "topic-1",
    title: "Almanya Vize Süreci Hakkında",
    status: "pending",
    authorId: "user-1",
    authorDisplayName: "Normal Kullanıcı",
    categoryId: "cat-1",
    categoryName: "Vize",
    countryName: "Almanya",
    createdAt: "2024-03-15T10:00:00Z",
  },
  {
    id: "topic-2",
    title: "Hollanda İş İzni Deneyimim",
    status: "pending",
    authorId: "user-2",
    authorDisplayName: "Premium Kullanıcı",
    categoryId: "cat-2",
    categoryName: "Çalışma İzni",
    countryName: "Hollanda",
    createdAt: "2024-03-16T11:30:00Z",
  },
];

export const premiumPlans: PremiumPlan[] = [
  {
    id: "plan-1",
    name: "Aylık Premium",
    description: "30 günlük premium üyelik",
    price: 99,
    durationDays: 30,
    features: ["Sınırsız forum", "Rehber erişimi", "Öncelikli destek"],
    isActive: true,
    createdAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "plan-2",
    name: "Haftalık Premium",
    description: "7 günlük premium üyelik",
    price: 29,
    durationDays: 7,
    features: ["Forum erişimi"],
    isActive: false,
    createdAt: "2024-01-02T00:00:00Z",
  },
];

export const adminConfig: AdminConfig = {
  app: { name: "GoWorldy", version: "1.2.0", url: "https://goworldy.com" },
  forum: { createTopicCost: 10, commentAccessCost: 5, createAdCost: 50, weeklyTopicReward: 20 },
  premium: { weeklyPrice: 29, monthlyPrice: 99 },
  guide: { enableNotifications: true, enableRecommendations: true },
  notifications: { enableEmail: true, enableInApp: false },
};

// ── Handlers ─────────────────────────────────────────────────────────────────

export const handlers = [
  // Auth
  http.post(`${BASE}/auth/login`, async ({ request }) => {
    const body = await request.json() as { email: string; password: string };
    if (body.email === "admin@goworldy.com" && body.password === "admin123") {
      return HttpResponse.json({ token: "fake-jwt-token", user: adminUser });
    }
    if (body.email === "user@test.com") {
      return HttpResponse.json({ token: "user-token", user: regularUser });
    }
    return HttpResponse.json({ error: "Geçersiz e-posta veya şifre." }, { status: 401 });
  }),

  // Dashboard
  http.get(`${BASE}/admin/dashboard`, () =>
    HttpResponse.json({ stats: dashboardStats })
  ),

  // Users
  http.get(`${BASE}/admin/users`, ({ request }) => {
    const url = new URL(request.url);
    const search = url.searchParams.get("search");
    const users = [adminUser, regularUser, premiumUser];
    if (search) {
      const q = search.toLowerCase();
      return HttpResponse.json(users.filter(
        (u) => u.displayName.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
      ));
    }
    return HttpResponse.json(users);
  }),

  http.patch(`${BASE}/admin/users/:id/role`, async ({ params, request }) => {
    const body = await request.json() as { role: string };
    return HttpResponse.json({ ok: true, id: params.id, role: body.role });
  }),

  // Forum / Topics
  http.get(`${BASE}/admin/forum/pending`, () =>
    HttpResponse.json(pendingTopics)
  ),

  http.patch(`${BASE}/forum/topics/:id/status`, async ({ params, request }) => {
    const body = await request.json() as { status: string; reason?: string };
    return HttpResponse.json({ ok: true, id: params.id, status: body.status });
  }),

  // Premium Plans
  http.get(`${BASE}/admin/premium/plans`, () =>
    HttpResponse.json(premiumPlans)
  ),

  http.post(`${BASE}/admin/premium/plans`, async ({ request }) => {
    const body = await request.json() as Partial<PremiumPlan>;
    const newPlan: PremiumPlan = {
      id: "plan-new",
      name: body.name ?? "Yeni Plan",
      description: body.description ?? "",
      price: body.price ?? 0,
      durationDays: body.durationDays ?? 30,
      features: body.features ?? [],
      isActive: body.isActive !== false,
      createdAt: new Date().toISOString(),
    };
    return HttpResponse.json(newPlan, { status: 201 });
  }),

  http.patch(`${BASE}/admin/premium/plans/:id`, () =>
    HttpResponse.json({ ok: true })
  ),

  http.delete(`${BASE}/admin/premium/plans/:id`, () =>
    HttpResponse.json({ ok: true })
  ),

  // Premium Users
  http.get(`${BASE}/admin/premium/users`, () =>
    HttpResponse.json([premiumUser])
  ),

  http.post(`${BASE}/admin/premium/users/:userId/grant`, () =>
    HttpResponse.json({ ok: true, premiumUntil: "2025-06-01T00:00:00Z" })
  ),

  http.delete(`${BASE}/admin/premium/users/:userId/grant`, () =>
    HttpResponse.json({ ok: true })
  ),

  // Config
  http.get(`${BASE}/admin/config`, () =>
    HttpResponse.json(adminConfig)
  ),
];
