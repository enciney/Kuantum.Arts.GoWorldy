import { api as defaultApi } from "../../services/api";

export interface Comment {
  id: string;
  authorId: string;
  authorDisplayName: string;
  content: string;
  createdAt: string;
}

export interface UpvoteResult {
  upvotes: number;
  hasVoted: boolean;
}

export async function loadComments(
  topicId: string,
  token: string,
  apiForum: typeof defaultApi.forum = defaultApi.forum
): Promise<Comment[]> {
  if (!token) return [];
  return apiForum.getComments(topicId, token);
}

export async function postComment(
  topicId: string,
  content: string,
  token: string,
  apiForum: typeof defaultApi.forum = defaultApi.forum
): Promise<{ id: string }> {
  if (!token) throw new Error("Token gerekli");
  if (!content.trim()) throw new Error("Yorum boş olamaz.");
  return apiForum.createComment(topicId, content.trim(), token);
}

export async function upvoteTopic(
  topicId: string,
  token: string,
  apiForum: typeof defaultApi.forum = defaultApi.forum
): Promise<UpvoteResult> {
  if (!token) throw new Error("Token gerekli");
  return apiForum.upvoteTopic(topicId, token);
}
