import { api as defaultApi, AdminTopic, DeletionRequest } from "../../services/api";

export interface PendingTopicsResult {
  topics: AdminTopic[];
  error: string | null;
}

export interface DeletionRequestsResult {
  requests: DeletionRequest[];
  error: string | null;
}

export async function loadPendingTopics(
  token: string,
  adminApi: typeof defaultApi.admin = defaultApi.admin
): Promise<PendingTopicsResult> {
  if (!token) return { topics: [], error: null };
  try {
    const topics = await adminApi.getPendingTopics(token);
    return { topics, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Konular yüklenemedi";
    return { topics: [], error: message };
  }
}

export async function approveTopicHandler(
  id: string,
  token: string,
  adminApi: typeof defaultApi.admin = defaultApi.admin
): Promise<boolean> {
  try {
    await adminApi.updateTopicStatus(id, "approved", token);
    return true;
  } catch {
    return false;
  }
}

export async function rejectTopicHandler(
  id: string,
  reason: string,
  token: string,
  adminApi: typeof defaultApi.admin = defaultApi.admin
): Promise<boolean> {
  try {
    await adminApi.updateTopicStatus(id, "rejected", token, reason);
    return true;
  } catch {
    return false;
  }
}

export async function loadDeletionRequests(
  token: string,
  adminApi: typeof defaultApi.admin = defaultApi.admin
): Promise<DeletionRequestsResult> {
  if (!token) return { requests: [], error: null };
  try {
    const requests = await adminApi.getDeletionRequests(token);
    return { requests, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Silme istekleri yüklenemedi";
    return { requests: [], error: message };
  }
}

export async function resolveDeletionRequestHandler(
  id: string,
  status: "approved" | "rejected",
  token: string,
  adminApi: typeof defaultApi.admin = defaultApi.admin
): Promise<boolean> {
  try {
    await adminApi.resolveDeletionRequest(id, status, token);
    return true;
  } catch {
    return false;
  }
}
