import { api as defaultApi } from "../../services/api";

export interface Notif {
  id: string;
  type: "topic_approved" | "topic_rejected" | "comment_reply" | "system";
  title: string;
  message: string;
  targetType?: "forum_topic" | null;
  targetId?: string | null;
  read: boolean;
  createdAt: string;
}

export interface CountrySub {
  countryId: string;
  countryName: string;
  countryCode: string;
  subscribed: boolean;
}

export async function loadNotifications(
  token: string,
  apiNotifs: typeof defaultApi.notifications = defaultApi.notifications
): Promise<Notif[]> {
  if (!token) return [];
  return apiNotifs.getAll(token);
}

export async function loadSubscriptions(
  token: string,
  apiNotifs: typeof defaultApi.notifications = defaultApi.notifications
): Promise<CountrySub[]> {
  if (!token) return [];
  return apiNotifs.getSubscriptions(token);
}

export async function markAllNotificationsRead(
  token: string,
  apiNotifs: typeof defaultApi.notifications = defaultApi.notifications
): Promise<void> {
  if (!token) return;
  await apiNotifs.markAllRead(token);
}

export async function markNotificationRead(
  notifId: string,
  token: string,
  apiNotifs: typeof defaultApi.notifications = defaultApi.notifications
): Promise<void> {
  if (!token) return;
  await apiNotifs.markRead(notifId, token);
}

export interface ToggleResult {
  success: boolean;
  rolledBack: boolean;
}

/**
 * currentValue: mevcut subscribed durumu. API'ya tersini gönderir.
 * Hata durumunda rolledBack=true döner — ekran state'i geri alır.
 */
export async function toggleCountrySubscription(
  countryId: string,
  currentValue: boolean,
  token: string,
  apiNotifs: typeof defaultApi.notifications = defaultApi.notifications
): Promise<ToggleResult> {
  if (!token) return { success: false, rolledBack: false };
  try {
    await apiNotifs.setSubscription(countryId, !currentValue, token);
    return { success: true, rolledBack: false };
  } catch {
    return { success: false, rolledBack: true };
  }
}
