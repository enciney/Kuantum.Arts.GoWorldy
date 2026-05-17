import { api as defaultApi } from "../../services/api";

export interface Topic {
  id: string;
  title: string;
  authorId: string;
  isPinned: boolean;
  status: string;
  createdAt: string;
  commentCount: number;
  upvotes: number;
  hasUpvoted: boolean;
}

export interface TopicsResult {
  data: Topic[];
  page: number;
  totalPages: number;
  total: number;
}

/** upvotes/hasUpvoted undefined gelebilir — 0/false'a normalize eder. */
export async function loadTopics(
  categoryId: string,
  token: string,
  page = 1,
  limit = 20,
  apiForum: typeof defaultApi.forum = defaultApi.forum
): Promise<TopicsResult> {
  if (!token) return { data: [], page: 1, totalPages: 1, total: 0 };
  const result = await apiForum.getTopics(categoryId, token, page, limit);
  return {
    ...result,
    data: result.data.map((t) => ({
      ...t,
      upvotes: t.upvotes ?? 0,
      hasUpvoted: t.hasUpvoted ?? false,
    })),
  };
}

export async function upvoteTopicInList(
  topicId: string,
  token: string,
  apiForum: typeof defaultApi.forum = defaultApi.forum
): Promise<{ upvotes: number; hasVoted: boolean }> {
  if (!token) throw new Error("Token gerekli");
  return apiForum.upvoteTopic(topicId, token);
}
