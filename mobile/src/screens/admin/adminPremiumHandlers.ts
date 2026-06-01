import { api as defaultApi, PremiumPlan } from "../../services/api";

export interface PlansResult {
  plans: PremiumPlan[];
  error: string | null;
}

export async function loadPremiumPlans(
  token: string,
  adminApi: typeof defaultApi.admin = defaultApi.admin
): Promise<PlansResult> {
  if (!token) return { plans: [], error: null };
  try {
    const plans = await adminApi.getPremiumPlans(token);
    return { plans, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Planlar yüklenemedi";
    return { plans: [], error: message };
  }
}

export async function createPlanHandler(
  data: Omit<PremiumPlan, "id" | "createdAt">,
  token: string,
  adminApi: typeof defaultApi.admin = defaultApi.admin
): Promise<PremiumPlan | null> {
  try {
    const plan = await adminApi.createPremiumPlan(data, token);
    return plan;
  } catch {
    return null;
  }
}

export async function updatePlanHandler(
  id: string,
  data: Partial<PremiumPlan>,
  token: string,
  adminApi: typeof defaultApi.admin = defaultApi.admin
): Promise<boolean> {
  try {
    await adminApi.updatePremiumPlan(id, data, token);
    return true;
  } catch {
    return false;
  }
}

export async function deletePlanHandler(
  id: string,
  token: string,
  adminApi: typeof defaultApi.admin = defaultApi.admin
): Promise<boolean> {
  try {
    await adminApi.deletePremiumPlan(id, token);
    return true;
  } catch {
    return false;
  }
}
