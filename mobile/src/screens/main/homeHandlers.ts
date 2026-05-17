import { api as defaultApi } from "../../services/api";

export interface HomeStats {
  countryId: string | null;
  countryName: string;
  completedSteps: number;
  totalSteps: number;
  completionPct: number;
  countriesWithProgress: number;
}

export interface HomeActivity {
  type: "comment" | "guide";
  id: string;
  title: string;
  preview: string;
  targetId: string | null;
  createdAt: string;
}

export interface HomeData {
  stats: HomeStats;
  activities: HomeActivity[];
}

const DEFAULT_STATS: HomeStats = {
  countryId: null,
  countryName: "",
  completedSteps: 0,
  totalSteps: 0,
  completionPct: 0,
  countriesWithProgress: 0,
};

/**
 * Guide stats ve activity feed'i paralel yükler.
 * Her biri bağımsız hata yönetir — biri başarısız olsa diğeri döner.
 */
export async function loadHomeData(
  token: string,
  apiGuide: typeof defaultApi.guide = defaultApi.guide,
  apiUsers: typeof defaultApi.users = defaultApi.users
): Promise<HomeData> {
  if (!token) return { stats: DEFAULT_STATS, activities: [] };

  const [stats, activities] = await Promise.all([
    apiGuide.getHomeStats(token).catch(() => DEFAULT_STATS),
    apiUsers.myActivity(token).catch(() => [] as HomeActivity[]),
  ]);

  return { stats: stats as HomeStats, activities: activities as HomeActivity[] };
}
