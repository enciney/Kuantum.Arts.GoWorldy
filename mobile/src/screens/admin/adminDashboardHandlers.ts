import { api as defaultApi, AdminDashboardStats } from "../../services/api";

export interface DashboardResult {
  stats: AdminDashboardStats | null;
  error: string | null;
}

const DEFAULT_STATS: AdminDashboardStats = {
  totalUsers: 0,
  totalTopics: 0,
  totalComments: 0,
  totalCountries: 0,
};

export async function loadAdminDashboard(
  token: string,
  adminApi: typeof defaultApi.admin = defaultApi.admin
): Promise<DashboardResult> {
  if (!token) return { stats: DEFAULT_STATS, error: null };
  try {
    const res = await adminApi.getDashboard(token);
    return { stats: res.stats ?? (res as unknown as AdminDashboardStats), error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Dashboard yüklenemedi";
    return { stats: DEFAULT_STATS, error: message };
  }
}
