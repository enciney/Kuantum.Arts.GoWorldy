import { api as defaultApi } from "../../services/api";

export interface ProfileData {
  id: string;
  email: string;
  displayName: string;
  bio?: string;
  avatarUrl?: string;
  role: string;
  isPremium: boolean;
  userType?: "emigrant" | "consultant" | "diaspora";
  phoneNumber?: string;
  sharePhoneNumber?: boolean;
}

export interface ProfileStats {
  topicCount: number;
  commentCount: number;
  followingCount: number;
  completedSteps: number;
}

export async function loadProfileData(
  token: string,
  apiUsers: typeof defaultApi.users = defaultApi.users
): Promise<{ profile: ProfileData; stats: ProfileStats }> {
  if (!token) throw new Error("Token gerekli");
  const [profile, stats] = await Promise.all([
    apiUsers.me(token),
    apiUsers.myStats(token),
  ]);
  return { profile: profile as ProfileData, stats };
}

/**
 * Aynı type seçilirse API çağrısı yapmaz.
 */
export async function selectUserType(
  type: "emigrant" | "consultant" | "diaspora",
  currentType: string,
  token: string,
  apiUsers: typeof defaultApi.users = defaultApi.users
): Promise<void> {
  if (!token) throw new Error("Token gerekli");
  if (type === currentType) return;
  await apiUsers.updateMe({ userType: type }, token);
}

export async function saveBio(
  bio: string,
  token: string,
  apiUsers: typeof defaultApi.users = defaultApi.users
): Promise<void> {
  if (!token) throw new Error("Token gerekli");
  await apiUsers.updateMe({ bio }, token);
}

export async function uploadAvatar(
  dataUrl: string,
  token: string,
  apiUsers: typeof defaultApi.users = defaultApi.users
): Promise<void> {
  if (!token) throw new Error("Token gerekli");
  if (!dataUrl) throw new Error("Fotoğraf verisi gerekli");
  await apiUsers.updateMe({ avatarUrl: dataUrl }, token);
}
