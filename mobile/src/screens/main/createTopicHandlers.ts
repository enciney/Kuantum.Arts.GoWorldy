import { api as defaultApi } from "../../services/api";

export interface TitleValidation {
  valid: boolean;
  error?: string;
}

export function validateTopicTitle(title: string): TitleValidation {
  if (!title.trim()) return { valid: false, error: "Konu başlığı boş olamaz." };
  if (title.trim().length < 10) return { valid: false, error: "Başlık en az 10 karakter olmalı." };
  return { valid: true };
}

export function canCreateTopicFree(role?: string, isPremium?: boolean): boolean {
  return role === "admin" || role === "moderator" || isPremium === true;
}

export interface CreateTopicResult {
  id: string;
  status: string;
}

export async function createTopic(
  categoryId: string,
  title: string,
  token: string,
  apiForum: typeof defaultApi.forum = defaultApi.forum,
  content?: string
): Promise<CreateTopicResult> {
  if (!token) throw new Error("Token gerekli");
  if (!categoryId) throw new Error("Kategori gerekli");
  return apiForum.createTopic(categoryId, title.trim(), token, content?.trim() || undefined);
}

export interface PostCreateAction {
  toast: { variant: "success" | "info"; message: string };
  navigate: "goBack";
}

export function buildPostCreateAction(
  topic: { status?: string },
  isStaff: boolean
): PostCreateAction {
  if (isStaff || topic.status === "approved") {
    return {
      toast: { variant: "success", message: "Konunuz yayınlandı." },
      navigate: "goBack",
    };
  }
  return {
    toast: {
      variant: "info",
      message: "Konunuz incelemeye alındı. Onaylanınca bildirim göndereceğiz.",
    },
    navigate: "goBack",
  };
}
