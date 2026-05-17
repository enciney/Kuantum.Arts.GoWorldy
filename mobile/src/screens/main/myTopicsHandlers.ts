import { api as defaultApi } from "../../services/api";

export interface MyTopic {
  id: string;
  title: string;
  status: string;
  isPinned: boolean;
  commentCount: number;
  createdAt: string;
}

export async function loadMyTopics(
  token: string,
  apiUsers: typeof defaultApi.users = defaultApi.users
): Promise<MyTopic[]> {
  if (!token) return [];
  return apiUsers.myTopics(token);
}
