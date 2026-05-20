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

export type TopicMenuAction = "edit" | "delete" | "report" | "cancel";

export interface TopicMenuOption {
  text: string;
  action: TopicMenuAction;
  style?: "destructive" | "cancel";
}

export interface TopicMenuContext {
  isOwner: boolean;
  canEditTopic: boolean;
  canStaffEdit: boolean;
  loggedIn: boolean;
}

// FRM-TPC-005 + FRM-TPC-006: konu başlığı 3-nokta menüsünün opsiyonlarını
// derleyen pure function. Component'tan ayrılarak unit-test edilebilir.
export function buildTopicMenuOptions(ctx: TopicMenuContext): TopicMenuOption[] {
  const opts: TopicMenuOption[] = [];
  if (ctx.canEditTopic || ctx.canStaffEdit) {
    opts.push({ text: "Konuyu düzenle", action: "edit" });
  }
  if (ctx.isOwner) {
    opts.push({ text: "Silme talebi gönder", action: "delete", style: "destructive" });
  }
  if (!ctx.isOwner && ctx.loggedIn) {
    opts.push({ text: "Raporla", action: "report" });
  }
  opts.push({ text: "İptal", action: "cancel", style: "cancel" });
  return opts;
}

export type CommentMenuAction = "edit" | "delete" | "report" | "cancel";

export interface CommentMenuOption {
  text: string;
  action: CommentMenuAction;
  style?: "destructive" | "cancel";
}

export interface CommentMenuContext {
  isOwner: boolean;
  isStaff: boolean;
  loggedIn: boolean;
  isDeleted: boolean;
  // Owner edit penceresi (backend: 15 dakika). Staff her zaman düzenleyebilir.
  canEditComment: boolean;
}

// FRM-CMT-003 + FRM-CMT-004: yorum 3-nokta menüsünün opsiyonlarını derleyen
// pure function. buildTopicMenuOptions ile aynı pattern.
// Anonim veya silinmiş yorum için boş dizi döner (menü hiç açılmamalı).
export function buildCommentMenuOptions(ctx: CommentMenuContext): CommentMenuOption[] {
  if (!ctx.loggedIn || ctx.isDeleted) return [];
  const opts: CommentMenuOption[] = [];
  if (ctx.canEditComment) {
    opts.push({ text: "Düzenle", action: "edit" });
  }
  if (ctx.isOwner || ctx.isStaff) {
    opts.push({ text: "Sil", action: "delete", style: "destructive" });
  }
  if (!ctx.isOwner) {
    opts.push({ text: "Raporla", action: "report" });
  }
  opts.push({ text: "İptal", action: "cancel", style: "cancel" });
  return opts;
}

export type ReplyCollapseState = "collapsed" | "partial" | "expanded";

export const REPLY_PARTIAL_LIMIT = 2;

export function getVisibleReplies<T>(replies: T[], state: ReplyCollapseState): T[] {
  if (state === "collapsed") return [];
  if (state === "expanded") return replies.slice();
  return replies.slice(0, REPLY_PARTIAL_LIMIT);
}

export interface ReplyToggleInfo {
  label: string;
  nextState: ReplyCollapseState;
}

export function getReplyToggleLabel<T>(
  replies: T[],
  state: ReplyCollapseState
): ReplyToggleInfo | null {
  const total = replies.length;
  if (total === 0) return null;
  if (state === "partial") {
    if (total <= REPLY_PARTIAL_LIMIT) {
      return { label: "Yanıtları gizle", nextState: "collapsed" };
    }
    const remaining = total - REPLY_PARTIAL_LIMIT;
    return { label: `${remaining} yanıtı daha göster`, nextState: "expanded" };
  }
  if (state === "expanded") {
    return { label: "Yanıtları gizle", nextState: "collapsed" };
  }
  return { label: `${total} yanıtı göster`, nextState: "expanded" };
}

export interface ShareContent {
  message: string;
  url: string;
  title: string;
}

export function buildShareContent(
  topic: { id: string; title: string },
  baseUrls: { web: string }
): ShareContent {
  const title = topic.title ?? "";
  const webBase = (baseUrls.web ?? "").replace(/\/+$/, "");
  const url = `${webBase}/topic/${topic.id}`;
  const deepLink = `goworldy://topic/${topic.id}`;
  const message = `${title}\n\nGoWorldy'de oku: ${deepLink}`;
  return { message, url, title };
}

// FRM-TPC-005/006: ActionMenuModal'dan gelen seçim id'sini topic-menu
// callback'lerine yönlendirir. "cancel" id'si modal tarafından zaten
// onSelect'e gönderilmediği için burada handle edilmez.
export interface TopicMenuCallbacks {
  onEdit: () => void;
  onDelete: () => void;
  onReport: () => void;
}
export function dispatchTopicMenuSelect(
  action: TopicMenuAction | string,
  cb: TopicMenuCallbacks
): void {
  if (action === "edit") cb.onEdit();
  else if (action === "delete") cb.onDelete();
  else if (action === "report") cb.onReport();
}

// FRM-CMT-003/004: ActionMenuModal seçim id'sini comment-menu callback'lerine
// yönlendirir.
export interface CommentMenuCallbacks {
  onEdit: () => void;
  onDelete: () => void;
  onReport: () => void;
}
export function dispatchCommentMenuSelect(
  action: CommentMenuAction | string,
  cb: CommentMenuCallbacks
): void {
  if (action === "edit") cb.onEdit();
  else if (action === "delete") cb.onDelete();
  else if (action === "report") cb.onReport();
}

export async function upvoteTopic(
  topicId: string,
  token: string,
  apiForum: typeof defaultApi.forum = defaultApi.forum
): Promise<UpvoteResult> {
  if (!token) throw new Error("Token gerekli");
  return apiForum.upvoteTopic(topicId, token);
}

// FRM-CMT-004: Modal onayı sonrası yorum silme
export async function deleteComment(
  topicId: string,
  commentId: string,
  token: string,
  apiForum: typeof defaultApi.forum = defaultApi.forum
): Promise<void> {
  if (!token) throw new Error("Token gerekli");
  await apiForum.deleteComment(topicId, commentId, token);
}

export interface DeletionRequestResult {
  /** Modal kapanmalı mı (başarı veya duplicate) */
  shouldClose: boolean;
  /** 409 Conflict — zaten bir talep var */
  duplicate: boolean;
}

// FRM-TPC-006: Silme talebi — 409 duplicate durumu sessizce işlenir
export async function submitTopicDeletionRequest(
  topicId: string,
  reason: string,
  token: string,
  apiForum: typeof defaultApi.forum = defaultApi.forum
): Promise<DeletionRequestResult> {
  if (!token) throw new Error("Token gerekli");
  const trimmed = reason.trim();
  if (trimmed.length < 5) throw new Error("Silme sebebi en az 5 karakter olmalı.");
  try {
    await apiForum.requestTopicDeletion(topicId, trimmed, token);
    return { shouldClose: true, duplicate: false };
  } catch (e: unknown) {
    const { ApiError } = await import("../../services/api");
    if (e instanceof ApiError && e.status === 409) {
      return { shouldClose: true, duplicate: true };
    }
    throw e;
  }
}

// FRM-TPC-005: Konu sahibi düzenleme talebi gönderir
export async function submitTopicEditRequest(
  topicId: string,
  title: string,
  content: string | undefined,
  token: string,
  apiForum: typeof defaultApi.forum = defaultApi.forum
): Promise<{ id: string; status: string }> {
  if (!token) throw new Error("Token gerekli");
  const trimmedTitle = title.trim();
  if (trimmedTitle.length < 10) throw new Error("Başlık en az 10 karakter olmalı.");
  return apiForum.requestTopicEdit(topicId, { title: trimmedTitle, content }, token);
}
