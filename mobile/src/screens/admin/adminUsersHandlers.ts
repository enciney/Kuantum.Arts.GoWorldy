import { api as defaultApi, AdminUser } from "../../services/api";

export interface UsersResult {
  users: AdminUser[];
  error: string | null;
}

export async function loadAdminUsers(
  token: string,
  search: string,
  adminApi: typeof defaultApi.admin = defaultApi.admin
): Promise<UsersResult> {
  if (!token) return { users: [], error: null };
  try {
    const users = await adminApi.getUsers(token, search || undefined);
    return { users, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Kullanıcılar yüklenemedi";
    return { users: [], error: message };
  }
}

export async function updateUserRoleHandler(
  userId: string,
  role: string,
  token: string,
  adminApi: typeof defaultApi.admin = defaultApi.admin
): Promise<boolean> {
  try {
    await adminApi.updateUserRole(userId, role, token);
    return true;
  } catch {
    return false;
  }
}

export async function banUserHandler(
  userId: string,
  banned: boolean,
  token: string,
  adminApi: typeof defaultApi.admin = defaultApi.admin
): Promise<boolean> {
  try {
    await adminApi.banUser(userId, banned, token);
    return true;
  } catch {
    return false;
  }
}

export async function deleteUserHandler(
  userId: string,
  token: string,
  adminApi: typeof defaultApi.admin = defaultApi.admin
): Promise<boolean> {
  try {
    await adminApi.deleteUser(userId, token);
    return true;
  } catch {
    return false;
  }
}
