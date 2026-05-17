import { api as defaultApi } from "../../services/api";

export interface MyComment {
  id: string;
  topicId: string;
  topicTitle: string;
  content: string;
  createdAt: string;
}

export async function loadMyComments(
  token: string,
  apiUsers: typeof defaultApi.users = defaultApi.users
): Promise<MyComment[]> {
  if (!token) return [];
  return apiUsers.myComments(token);
}
