import { api as defaultApi, SystemSettings } from "../../services/api";

export interface SettingsResult {
  settings: SystemSettings | null;
  error: string | null;
}

export async function loadAdminSettings(
  token: string,
  adminApi: typeof defaultApi.admin = defaultApi.admin
): Promise<SettingsResult> {
  if (!token) return { settings: null, error: null };
  try {
    const settings = await adminApi.getSettings(token);
    return { settings, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Ayarlar yüklenemedi";
    return { settings: null, error: message };
  }
}

export async function saveSettingsHandler(
  data: Partial<SystemSettings>,
  token: string,
  adminApi: typeof defaultApi.admin = defaultApi.admin
): Promise<boolean> {
  try {
    await adminApi.updateSettings(data, token);
    return true;
  } catch {
    return false;
  }
}
