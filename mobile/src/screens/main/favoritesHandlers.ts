import { api as defaultApi } from "../../services/api";
import { FavoriteTopic } from "../../utils/favorites";

export const FAVORITES_PAGE_SIZE = 20;

export async function loadFavorites(
  token: string,
  offset = 0,
  limit = FAVORITES_PAGE_SIZE,
  apiUsers: typeof defaultApi.users = defaultApi.users
): Promise<FavoriteTopic[]> {
  if (!token) return [];
  return apiUsers.myFavorites(token, limit, offset);
}
