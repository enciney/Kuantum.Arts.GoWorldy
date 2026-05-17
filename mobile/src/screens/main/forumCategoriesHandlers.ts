import { api as defaultApi } from "../../services/api";

export interface Category {
  id: string;
  countryId: string;
  name: string;
  parentId?: string;
  topicCount?: number;
}

export async function loadCategories(
  countryId: string,
  token: string,
  apiForum: typeof defaultApi.forum = defaultApi.forum
): Promise<Category[]> {
  if (!token) return [];
  if (!countryId) return [];
  return apiForum.getCategories(countryId, token);
}
