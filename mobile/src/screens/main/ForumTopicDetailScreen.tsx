import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Modal,
  Share,
} from "react-native";
import {
  buildTopicMenuOptions,
  buildCommentMenuOptions,
  dispatchTopicMenuSelect,
  dispatchCommentMenuSelect,
  getVisibleReplies,
  getReplyToggleLabel,
  buildShareContent,
  type ReplyCollapseState,
} from "./forumTopicDetailHandlers";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../context/AuthContext";
import { api, ApiError } from "../../services/api";
import { Colors, Typography, Spacing, Radius, MinTapTarget } from "../../theme";
import { ActionMenuModal, type ActionMenuOption } from "../../components/ActionMenuModal";
import { WEB_BASE_URL } from "../../config/env";

interface Comment {
  id: string;
  authorId: string;
  authorDisplayName: string;
  content: string;
  parentCommentId?: string | null;
  createdAt: string;
  editedAt?: string;
  deletedAt?: string;
  likesCount?: number;
  hasLiked?: boolean;
}

interface TopicDetail {
  id: string;
  title: string;
  content?: string;
  authorId: string;
  createdAt: string;
  editedAt?: string;
  upvotes: number;
  hasUpvoted: boolean;
  favorited: boolean;
}

interface Props {
  topicId: string;
  topicTitle: string;
  topicAuthorId?: string;
  topicUpvotes?: number;
  topicHasUpvoted?: boolean;
  onBack: () => void;
}

type ReportReason = "spam" | "abuse" | "misleading" | "copyright" | "other";
const REPORT_REASONS: { value: ReportReason; label: string }[] = [
  { value: "spam", label: "Spam / Reklam" },
  { value: "abuse", label: "Hakaret / Küfür" },
  { value: "misleading", label: "Yanıltıcı bilgi" },
  { value: "copyright", label: "Telif ihlali" },
  { value: "other", label: "Diğer" },
];

const TOPIC_EDIT_WINDOW_MS = 24 * 60 * 60 * 1000;
// Backend: FRM-CMT-003 owner için 15 dakikalık düzenleme penceresi (staff sınırsız).
const COMMENT_EDIT_WINDOW_MS = 15 * 60 * 1000;

export function ForumTopicDetailScreen({ topicId, topicTitle, topicAuthorId = "", topicUpvotes = 0, topicHasUpvoted = false, onBack }: Props) {
  const { token, user, refreshUser } = useAuth();
  const isStaff = user?.role === "admin" || user?.role === "moderator";

  useEffect(() => {
    if (token && !user) refreshUser();
  }, [token, user, refreshUser]);

  const [topic, setTopic] = useState<TopicDetail>({
    id: topicId,
    title: topicTitle,
    authorId: topicAuthorId,
    createdAt: new Date().toISOString(),
    upvotes: topicUpvotes,
    hasUpvoted: topicHasUpvoted,
    favorited: false,
  });
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Reply / posting
  const [reply, setReply] = useState("");
  const [replyingTo, setReplyingTo] = useState<Comment | null>(null);
  const [posting, setPosting] = useState(false);

  // Topic actions
  const [upvoting, setUpvoting] = useState(false);
  const [faving, setFaving] = useState(false);

  // Collapse state for top-level comment replies (3-state: collapsed | partial | expanded)
  const [replyStates, setReplyStates] = useState<Record<string, ReplyCollapseState>>({});

  // Edit comment modal
  const [editing, setEditing] = useState<Comment | null>(null);
  const [editContent, setEditContent] = useState("");
  const [editSaving, setEditSaving] = useState(false);

  // Report modal (works for comment AND topic)
  const [reporting, setReporting] = useState<{ kind: "topic" | "comment"; id: string } | null>(null);
  const [reportReason, setReportReason] = useState<ReportReason>("spam");
  const [reportDesc, setReportDesc] = useState("");
  const [reportSubmitting, setReportSubmitting] = useState(false);

  // Edit topic modal (FRM-TPC-005)
  const [editTopicOpen, setEditTopicOpen] = useState(false);
  const [editTopicTitle, setEditTopicTitle] = useState("");
  const [editTopicContent, setEditTopicContent] = useState("");
  const [editTopicSaving, setEditTopicSaving] = useState(false);

  // Deletion request modal (FRM-TPC-006)
  const [delOpen, setDelOpen] = useState(false);
  const [delReason, setDelReason] = useState("");
  const [delSubmitting, setDelSubmitting] = useState(false);

  // Action menu (replaces Alert.alert for topic + comment 3-dot menus)
  type ActiveMenu =
    | { kind: "topic"; title: string; options: ActionMenuOption[] }
    | { kind: "comment"; title: string; options: ActionMenuOption[]; comment: Comment };
  const [activeMenu, setActiveMenu] = useState<ActiveMenu | null>(null);

  // FRM-CMT-004 — Modal-based comment delete confirm (avoids Android Alert.alert/Modal timing issue)
  const [pendingDeleteComment, setPendingDeleteComment] = useState<Comment | null>(null);
  const [commentDeleting, setCommentDeleting] = useState(false);

  const loadTopic = useCallback(async () => {
    try {
      const t = await api.forum.getTopic(topicId, token ?? undefined);
      setTopic({
        id: t.id,
        title: t.title,
        content: t.content,
        authorId: t.authorId,
        createdAt: t.createdAt,
        editedAt: t.editedAt,
        upvotes: t.upvotes ?? 0,
        hasUpvoted: t.hasUpvoted ?? false,
        favorited: t.favorited,
      });
    } catch {
      /* fall back to props */
    }
  }, [topicId, token]);

  const loadComments = useCallback(async () => {
    try {
      const data = await api.forum.getComments(topicId, token ?? undefined);
      setComments(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Yüklenemedi.");
    }
  }, [topicId, token]);

  useEffect(() => {
    Promise.all([loadTopic(), loadComments()]).finally(() => setLoading(false));
  }, [loadTopic, loadComments]);

  // ── Topic actions ──────────────────────────────────────────────────────────

  const handleUpvote = async () => {
    if (!token) {
      Alert.alert("Giriş Gerekli", "Upvote vermek için giriş yapmanız gerekiyor.");
      return;
    }
    if (upvoting) return;

    const prev = { upvotes: topic.upvotes, hasUpvoted: topic.hasUpvoted };
    setTopic((t) => ({ ...t, hasUpvoted: !t.hasUpvoted, upvotes: t.hasUpvoted ? t.upvotes - 1 : t.upvotes + 1 }));
    setUpvoting(true);
    try {
      const result = await api.forum.upvoteTopic(topicId, token);
      setTopic((t) => ({ ...t, upvotes: result.upvotes, hasUpvoted: result.hasVoted }));
    } catch {
      setTopic((t) => ({ ...t, ...prev }));
      Alert.alert("Hata", "Upvote işlemi başarısız oldu.");
    } finally {
      setUpvoting(false);
    }
  };

  // FRM-TPC-008
  const handleFavorite = async () => {
    if (!token) {
      Alert.alert("Giriş Gerekli", "Favorilere eklemek için giriş yapmalısınız.");
      return;
    }
    if (faving) return;
    const prev = topic.favorited;
    setTopic((t) => ({ ...t, favorited: !t.favorited }));
    setFaving(true);
    try {
      const r = await api.forum.toggleFavorite(topicId, token);
      setTopic((t) => ({ ...t, favorited: r.favorited }));
    } catch {
      setTopic((t) => ({ ...t, favorited: prev }));
      Alert.alert("Hata", "Favori işlemi başarısız oldu.");
    } finally {
      setFaving(false);
    }
  };

  const isTopicOwner = !!user && topic.authorId === user.id;
  const canEditTopic = isTopicOwner && (Date.now() - new Date(topic.createdAt).getTime() < TOPIC_EDIT_WINDOW_MS);
  const canStaffEdit = isStaff;

  const openEditTopic = () => {
    setEditTopicTitle(topic.title);
    setEditTopicContent(topic.content ?? "");
    setEditTopicOpen(true);
  };

  const submitEditTopic = async () => {
    if (!token) return;
    const title = editTopicTitle.trim();
    if (title.length < 10) {
      Alert.alert("Başlık çok kısa", "Başlık en az 10 karakter olmalı.");
      return;
    }
    setEditTopicSaving(true);
    try {
      if (isStaff) {
        // Staff doğrudan günceller
        await api.forum.updateTopic(topicId, { title, content: editTopicContent }, token);
        setEditTopicOpen(false);
        await loadTopic();
      } else {
        // Konu sahibi → edit-request gönderir, konu aktif kalır
        await api.forum.requestTopicEdit(topicId, { title, content: editTopicContent || undefined }, token);
        setEditTopicOpen(false);
        Alert.alert("Talep alındı", "Düzenleme talebiniz moderatöre iletildi. Onaylandığında konu güncellenecek.");
      }
    } catch (e: unknown) {
      Alert.alert("Hata", e instanceof Error ? e.message : "Düzenlenemedi.");
    } finally {
      setEditTopicSaving(false);
    }
  };

  // FRM-TPC-006
  const openDeletionRequest = () => {
    setDelReason("");
    setDelOpen(true);
  };

  const submitDeletionRequest = async () => {
    if (!token) return;
    const r = delReason.trim();
    if (r.length < 5) {
      Alert.alert("Sebep gerekli", "Silme sebebi en az 5 karakter olmalı.");
      return;
    }
    setDelSubmitting(true);
    try {
      await api.forum.requestTopicDeletion(topicId, r, token);
      // Sadece modal'i kapat — Alert kullanma (Android z-index sorunu + kullanıcı zaten bilgi sahibi)
      setDelOpen(false);
    } catch (e: unknown) {
      if (e instanceof ApiError && e.status === 409) {
        // Duplicate request: modal'i kapat, 400ms sonra bilgi ver
        setDelOpen(false);
        setTimeout(() => Alert.alert("Zaten gönderildi", "Bu konu için daha önce bir silme talebi oluşturulmuş."), 400);
      } else {
        Alert.alert("Hata", e instanceof Error ? e.message : "Talep iletilemedi.");
      }
    } finally {
      setDelSubmitting(false);
    }
  };

  const showTopicMenu = () => {
    const opts = buildTopicMenuOptions({
      isOwner: isTopicOwner,
      canEditTopic,
      canStaffEdit,
      loggedIn: !!token,
    });
    if (opts.length <= 1) return;
    setActiveMenu({
      kind: "topic",
      title: "Konu",
      options: opts.map((o) => ({ id: o.action, text: o.text, style: o.style })),
    });
  };

  const handleTopicMenuSelect = (action: string) => {
    dispatchTopicMenuSelect(action, {
      onEdit: openEditTopic,
      onDelete: openDeletionRequest,
      onReport: openReportTopic,
    });
  };

  const showTopicMenuVisible = !!token;

  const handleShare = async () => {
    try {
      const content = buildShareContent(
        { id: topic.id, title: topic.title },
        { web: WEB_BASE_URL }
      );
      await Share.share({
        message: content.message,
        url: content.url,
        title: content.title,
      });
    } catch {
      /* user cancel or share failure — no-op */
    }
  };

  // ── Comment actions ────────────────────────────────────────────────────────

  const handlePost = async () => {
    if (!reply.trim() || !token) return;
    setPosting(true);
    try {
      await api.forum.createComment(topicId, reply.trim(), token, replyingTo?.id);
      setReply("");
      // Yanıt verildiğinde parent thread'i açık tut
      if (replyingTo) {
        const parentId = replyingTo.parentCommentId ?? replyingTo.id;
        setReplyStates((c) => ({ ...c, [parentId]: "expanded" }));
      }
      setReplyingTo(null);
      await loadComments();
    } catch (e: unknown) {
      Alert.alert("Yorum gönderilemedi", e instanceof Error ? e.message : "Bilinmeyen hata");
    } finally {
      setPosting(false);
    }
  };

  // FRM-CMT-005
  const handleLike = async (c: Comment) => {
    if (!token) {
      Alert.alert("Giriş Gerekli", "Beğenmek için giriş yapmalısınız.");
      return;
    }
    setComments((prev) =>
      prev.map((x) =>
        x.id === c.id
          ? { ...x, hasLiked: !x.hasLiked, likesCount: (x.likesCount ?? 0) + (x.hasLiked ? -1 : 1) }
          : x
      )
    );
    try {
      const r = await api.forum.likeComment(topicId, c.id, token);
      setComments((prev) =>
        prev.map((x) => (x.id === c.id ? { ...x, hasLiked: r.hasLiked, likesCount: r.likes } : x))
      );
    } catch (e: unknown) {
      Alert.alert("Hata", e instanceof Error ? e.message : "Beğeni başarısız.");
      await loadComments();
    }
  };

  // FRM-CMT-004 — ActionMenuModal kapandıktan sonra Modal tabanlı onay göster (Android z-index sorunu)
  const handleDelete = (c: Comment) => {
    // ActionMenuModal'in tam kapanması için kısa bekleme, sonra onay modal'ini aç
    setTimeout(() => setPendingDeleteComment(c), 300);
  };

  const confirmDeleteComment = async () => {
    if (!pendingDeleteComment || !token) return;
    setCommentDeleting(true);
    try {
      await api.forum.deleteComment(topicId, pendingDeleteComment.id, token);
      setPendingDeleteComment(null);
      await loadComments();
    } catch (e: unknown) {
      setPendingDeleteComment(null);
      setTimeout(() => Alert.alert("Hata", e instanceof Error ? e.message : "Silinemedi."), 300);
    } finally {
      setCommentDeleting(false);
    }
  };

  // FRM-CMT-003
  const openEdit = (c: Comment) => {
    setEditing(c);
    setEditContent(c.content);
  };
  const submitEdit = async () => {
    if (!editing || !token) return;
    const trimmed = editContent.trim();
    if (!trimmed) {
      Alert.alert("Boş", "Yorum boş olamaz.");
      return;
    }
    setEditSaving(true);
    try {
      await api.forum.updateComment(topicId, editing.id, trimmed, token);
      setEditing(null);
      setEditContent("");
      await loadComments();
    } catch (e: unknown) {
      Alert.alert("Hata", e instanceof Error ? e.message : "Düzenlenemedi.");
    } finally {
      setEditSaving(false);
    }
  };

  // FRM-CMT-007 / MOD-REP-001
  const openReportComment = (c: Comment) => {
    setReporting({ kind: "comment", id: c.id });
    setReportReason("spam");
    setReportDesc("");
  };
  const openReportTopic = () => {
    setReporting({ kind: "topic", id: topicId });
    setReportReason("spam");
    setReportDesc("");
  };

  const submitReport = async () => {
    if (!reporting || !token) return;
    setReportSubmitting(true);
    try {
      await api.reports.create(
        {
          targetType: reporting.kind,
          targetId: reporting.id,
          reason: reportReason,
          description: reportDesc.trim() || undefined,
        },
        token
      );
      setReporting(null);
      Alert.alert("Teşekkürler", "Raporun alındı, ekibimiz değerlendirecek.");
    } catch (e: unknown) {
      Alert.alert("Hata", e instanceof Error ? e.message : "Gönderilemedi.");
    } finally {
      setReportSubmitting(false);
    }
  };

  const showCommentMenu = (c: Comment) => {
    const isOwner = !!user && c.authorId === user.id;
    const ageMs = Date.now() - new Date(c.createdAt).getTime();
    const ownerWithinWindow = isOwner && ageMs < COMMENT_EDIT_WINDOW_MS;
    // Staff her zaman düzenleyebilir; owner ise 15 dk içinde.
    const canEditComment = ownerWithinWindow || isStaff;

    const opts = buildCommentMenuOptions({
      isOwner,
      isStaff,
      loggedIn: !!token,
      isDeleted: !!c.deletedAt,
      canEditComment,
    });
    if (opts.length === 0) return;
    setActiveMenu({
      kind: "comment",
      title: "Yorum",
      comment: c,
      options: opts.map((o) => ({ id: o.action, text: o.text, style: o.style })),
    });
  };

  const handleCommentMenuSelect = (action: string, c: Comment) => {
    dispatchCommentMenuSelect(action, {
      onEdit: () => openEdit(c),
      onDelete: () => handleDelete(c),
      onReport: () => openReportComment(c),
    });
  };

  // ── Comment tree (top-level + grouped replies) ────────────────────────────
  type CommentNode = { top: Comment; replies: Comment[] };
  const tree: CommentNode[] = useMemo(() => {
    const tops: Comment[] = [];
    const repliesByParent: Record<string, Comment[]> = {};
    for (const c of comments) {
      if (c.parentCommentId) {
        (repliesByParent[c.parentCommentId] ??= []).push(c);
      } else {
        tops.push(c);
      }
    }
    return tops.map((top) => ({
      top,
      replies: (repliesByParent[top.id] ?? []).sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      ),
    }));
  }, [comments]);

  const setReplyState = (parentId: string, next: ReplyCollapseState) =>
    setReplyStates((c) => ({ ...c, [parentId]: next }));

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={26} color={Colors.primary} />
        </TouchableOpacity>
        <Text style={styles.title} numberOfLines={2}>{topic.title}</Text>
        {showTopicMenuVisible && (
          <Pressable
            onPress={showTopicMenu}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            style={({ pressed }) => [styles.topicMenuBtn, pressed && { opacity: 0.6 }]}
            accessibilityLabel="Konu menüsü"
            accessibilityRole="button"
            testID="topic-menu-btn"
          >
            <Ionicons name="ellipsis-vertical" size={22} color={Colors.textSecondary} />
          </Pressable>
        )}
      </View>

      {!!topic.content && (
        <View style={styles.topicContentBox}>
          <Text style={styles.topicContentText}>{topic.content}</Text>
          {topic.editedAt && (
            <Text style={styles.editedTagSmall}>düzenlendi</Text>
          )}
        </View>
      )}

      <View style={styles.topicMeta}>
        <TouchableOpacity
          onPress={handleUpvote}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 12, right: 12 }}
          style={[styles.upvoteBtn, topic.hasUpvoted && styles.upvoteBtnActive]}
        >
          <Ionicons
            name={topic.hasUpvoted ? "arrow-up" : "arrow-up-outline"}
            size={18}
            color={topic.hasUpvoted ? Colors.primary : Colors.textMuted}
          />
          <Text style={[styles.upvoteCount, topic.hasUpvoted && styles.upvoteCountActive]}>
            {topic.upvotes}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleFavorite}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 12, right: 12 }}
          style={[styles.favBtn, topic.favorited && styles.favBtnActive]}
        >
          <Ionicons
            name={topic.favorited ? "bookmark" : "bookmark-outline"}
            size={18}
            color={topic.favorited ? Colors.warning : Colors.textMuted}
          />
          <Text style={[styles.favLabel, topic.favorited && { color: Colors.warning }]}>
            {topic.favorited ? "Favorimde" : "Favorile"}
          </Text>
        </TouchableOpacity>

        <Pressable
          onPress={handleShare}
          hitSlop={{ top: 8, bottom: 8, left: 12, right: 12 }}
          style={({ pressed }) => [styles.favBtn, pressed && { opacity: 0.6 }]}
          accessibilityLabel="Konuyu paylaş"
          accessibilityRole="button"
          testID="topic-share-btn"
        >
          <Ionicons name="share-outline" size={18} color={Colors.textMuted} />
          <Text style={styles.favLabel}>Paylaş</Text>
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator color={Colors.primary} /></View>
      ) : error ? (
        <View style={styles.center}>
          <Ionicons name="alert-circle" size={32} color={Colors.danger} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : (
        <FlatList
          data={tree}
          keyExtractor={(node) => node.top.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Ionicons name="chatbubble-ellipses-outline" size={42} color={Colors.textMuted} />
              <Text style={styles.emptyTitle}>Henüz yorum yok</Text>
              <Text style={styles.emptyText}>İlk yorumu yapan sen ol!</Text>
            </View>
          }
          renderItem={({ item }) => {
            const state: ReplyCollapseState = replyStates[item.top.id] ?? "partial";
            const visibleReplies = getVisibleReplies(item.replies, state);
            const toggle = getReplyToggleLabel(item.replies, state);
            return (
              <View>
                <CommentRow
                  comment={item.top}
                  isMine={item.top.authorId === user?.id}
                  onLike={() => handleLike(item.top)}
                  onReply={() => setReplyingTo(item.top)}
                  onMenu={() => showCommentMenu(item.top)}
                  loggedIn={!!token}
                />
                {visibleReplies.map((r) => (
                  <CommentRow
                    key={r.id}
                    comment={r}
                    isMine={r.authorId === user?.id}
                    onLike={() => handleLike(r)}
                    onReply={() => setReplyingTo(r)}
                    onMenu={() => showCommentMenu(r)}
                    loggedIn={!!token}
                    isReply
                  />
                ))}
                {toggle && (
                  <TouchableOpacity
                    style={styles.collapseBtn}
                    onPress={() => setReplyState(item.top.id, toggle.nextState)}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={toggle.nextState === "collapsed" ? "chevron-up" : "chevron-down"}
                      size={14}
                      color={Colors.primary}
                    />
                    <Text style={styles.collapseText}>{toggle.label}</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          }}
        />
      )}

      {/* Reply hint bar */}
      {replyingTo && (
        <View style={styles.replyHint}>
          <Ionicons name="return-down-forward" size={14} color={Colors.textSecondary} />
          <Text style={styles.replyHintText} numberOfLines={1}>
            {replyingTo.authorDisplayName} kullanıcısına yanıt veriyorsun
          </Text>
          <TouchableOpacity onPress={() => setReplyingTo(null)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="close" size={16} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.replyBar}>
        <TextInput
          style={styles.replyInput}
          placeholder={replyingTo ? "Yanıtını yaz..." : "Yorum yaz..."}
          placeholderTextColor={Colors.textMuted}
          value={reply}
          onChangeText={setReply}
          multiline
          maxLength={1000}
        />
        <TouchableOpacity
          style={[styles.sendBtn, (!reply.trim() || posting) && styles.sendBtnDisabled]}
          onPress={handlePost}
          disabled={!reply.trim() || posting}
        >
          {posting ? <ActivityIndicator size="small" color={Colors.surface} /> : <Ionicons name="send" size={18} color={Colors.surface} />}
        </TouchableOpacity>
      </View>

      {/* Edit comment modal */}
      <Modal visible={!!editing} transparent animationType="fade" onRequestClose={() => setEditing(null)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Yorumu düzenle</Text>
            <TextInput
              style={styles.modalInput}
              value={editContent}
              onChangeText={setEditContent}
              multiline
              maxLength={1000}
              placeholder="Yorumun..."
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalBtnGhost} onPress={() => setEditing(null)} disabled={editSaving}>
                <Text style={styles.modalBtnGhostText}>Vazgeç</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalBtnPrimary} onPress={submitEdit} disabled={editSaving}>
                {editSaving ? <ActivityIndicator color="#fff" /> : <Text style={styles.modalBtnPrimaryText}>Kaydet</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Report modal (topic or comment) */}
      <Modal visible={!!reporting} transparent animationType="fade" onRequestClose={() => setReporting(null)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              {reporting?.kind === "topic" ? "Konuyu raporla" : "Yorumu raporla"}
            </Text>
            <Text style={styles.modalSubtitle}>Bu içeriğin neden uygunsuz olduğunu bize bildir.</Text>
            {REPORT_REASONS.map((r) => (
              <TouchableOpacity
                key={r.value}
                style={[styles.reasonOption, reportReason === r.value && styles.reasonOptionActive]}
                onPress={() => setReportReason(r.value)}
              >
                <Ionicons
                  name={reportReason === r.value ? "radio-button-on" : "radio-button-off"}
                  size={18}
                  color={reportReason === r.value ? Colors.primary : Colors.textMuted}
                />
                <Text style={styles.reasonText}>{r.label}</Text>
              </TouchableOpacity>
            ))}
            <TextInput
              style={[styles.modalInput, { marginTop: Spacing.sm, minHeight: 60 }]}
              value={reportDesc}
              onChangeText={setReportDesc}
              multiline
              maxLength={500}
              placeholder="Ek açıklama (opsiyonel)"
              placeholderTextColor={Colors.textMuted}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalBtnGhost} onPress={() => setReporting(null)} disabled={reportSubmitting}>
                <Text style={styles.modalBtnGhostText}>Vazgeç</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalBtnPrimary} onPress={submitReport} disabled={reportSubmitting}>
                {reportSubmitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.modalBtnPrimaryText}>Raporla</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit topic modal (FRM-TPC-005) */}
      <Modal visible={editTopicOpen} transparent animationType="fade" onRequestClose={() => setEditTopicOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Konuyu düzenle</Text>
            <Text style={styles.modalSubtitle}>Başlık ve içeriği güncelleyebilirsin.</Text>
            <TextInput
              style={styles.modalInput}
              value={editTopicTitle}
              onChangeText={setEditTopicTitle}
              maxLength={120}
              placeholder="Başlık (en az 10 karakter)"
              placeholderTextColor={Colors.textMuted}
            />
            <TextInput
              style={[styles.modalInput, { marginTop: Spacing.sm, minHeight: 120 }]}
              value={editTopicContent}
              onChangeText={setEditTopicContent}
              multiline
              maxLength={5000}
              placeholder="İçerik (opsiyonel)"
              placeholderTextColor={Colors.textMuted}
              textAlignVertical="top"
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalBtnGhost} onPress={() => setEditTopicOpen(false)} disabled={editTopicSaving}>
                <Text style={styles.modalBtnGhostText}>Vazgeç</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalBtnPrimary} onPress={submitEditTopic} disabled={editTopicSaving}>
                {editTopicSaving ? <ActivityIndicator color="#fff" /> : <Text style={styles.modalBtnPrimaryText}>Kaydet</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Action menu (3-dot) for topic + comment — FRM-TPC-005/006 + FRM-CMT-003/004 */}
      <ActionMenuModal
        visible={!!activeMenu}
        title={activeMenu?.title}
        options={activeMenu?.options ?? []}
        onSelect={(id) => {
          if (!activeMenu) return;
          if (activeMenu.kind === "topic") {
            handleTopicMenuSelect(id);
          } else {
            handleCommentMenuSelect(id, activeMenu.comment);
          }
        }}
        onClose={() => setActiveMenu(null)}
        testID="action-menu-modal"
      />

      {/* Comment delete confirm modal (FRM-CMT-004) */}
      <Modal visible={!!pendingDeleteComment} transparent animationType="fade" onRequestClose={() => setPendingDeleteComment(null)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Yorumu sil</Text>
            <Text style={styles.modalSubtitle}>Bu yorumu silmek istediğinden emin misin? Bu işlem geri alınamaz.</Text>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalBtnGhost} onPress={() => setPendingDeleteComment(null)} disabled={commentDeleting}>
                <Text style={styles.modalBtnGhostText}>Vazgeç</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtnPrimary, { backgroundColor: Colors.danger }]} onPress={confirmDeleteComment} disabled={commentDeleting}>
                {commentDeleting ? <ActivityIndicator color="#fff" /> : <Text style={styles.modalBtnPrimaryText}>Sil</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Deletion request modal (FRM-TPC-006) */}
      <Modal visible={delOpen} transparent animationType="fade" onRequestClose={() => setDelOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Silme talebi gönder</Text>
            <Text style={styles.modalSubtitle}>
              Konunun silinmesi için moderatöre talep iletilecek. Sebebini kısaca açıkla.
            </Text>
            <TextInput
              style={[styles.modalInput, { minHeight: 80 }]}
              value={delReason}
              onChangeText={setDelReason}
              multiline
              maxLength={300}
              placeholder="Silme sebebin..."
              placeholderTextColor={Colors.textMuted}
              textAlignVertical="top"
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalBtnGhost} onPress={() => setDelOpen(false)} disabled={delSubmitting}>
                <Text style={styles.modalBtnGhostText}>Vazgeç</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalBtnPrimary} onPress={submitDeletionRequest} disabled={delSubmitting}>
                {delSubmitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.modalBtnPrimaryText}>Gönder</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

function CommentRow({
  comment,
  isMine,
  onLike,
  onReply,
  onMenu,
  loggedIn,
  isReply,
}: {
  comment: Comment;
  isMine: boolean;
  onLike: () => void;
  onReply: () => void;
  onMenu: () => void;
  loggedIn: boolean;
  isReply?: boolean;
}) {
  const date = new Date(comment.createdAt);
  const dateLabel = date.toLocaleDateString("tr-TR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  const name = isMine ? "Sen" : comment.authorDisplayName;
  const initial = name.slice(0, 2).toUpperCase();

  return (
    <View style={[styles.comment, isMine && styles.commentMine, isReply && styles.commentReply]}>
      <View style={[styles.avatar, isMine && styles.avatarMine]}>
        <Text style={styles.avatarText}>{initial}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <View style={styles.commentHeader}>
          <Text style={styles.authorLabel}>{name}</Text>
          <View style={styles.commentHeaderRight}>
            <Text style={styles.commentDate}>{dateLabel}</Text>
            {!!loggedIn && !comment.deletedAt && (
              <Pressable
                onPress={onMenu}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                style={({ pressed }) => [styles.menuBtn, pressed && { opacity: 0.6 }]}
                accessibilityLabel="Yorum menüsü"
                accessibilityRole="button"
                testID="comment-menu-btn"
              >
                <Ionicons name="ellipsis-vertical" size={18} color={Colors.textSecondary} />
              </Pressable>
            )}
          </View>
        </View>
        <Text style={[styles.commentText, comment.deletedAt && styles.commentDeleted]}>
          {comment.deletedAt ? "Bu yorum silinmiş." : comment.content}
        </Text>
        {comment.editedAt && !comment.deletedAt && (
          <Text style={styles.editedTag}>düzenlendi</Text>
        )}

        {!comment.deletedAt && (
          <View style={styles.actionsRow}>
            <TouchableOpacity onPress={onLike} style={styles.actionBtn} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
              <Ionicons
                name={comment.hasLiked ? "heart" : "heart-outline"}
                size={16}
                color={comment.hasLiked ? Colors.danger : Colors.textMuted}
              />
              <Text style={[styles.actionText, comment.hasLiked && { color: Colors.danger }]}>
                {comment.likesCount ?? 0}
              </Text>
            </TouchableOpacity>
            {loggedIn && !isReply && (
              <TouchableOpacity onPress={onReply} style={styles.actionBtn} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                <Ionicons name="arrow-undo-outline" size={16} color={Colors.textMuted} />
                <Text style={styles.actionText}>Yanıtla</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: Spacing.sm,
    paddingTop: 56,
    paddingBottom: 12,
    backgroundColor: Colors.surface,
  },
  topicMenuBtn: {
    padding: 6,
    minWidth: MinTapTarget,
    minHeight: MinTapTarget,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
    elevation: 10,
  },
  topicContentBox: {
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.md,
    paddingTop: 4,
    paddingBottom: Spacing.sm,
  },
  topicContentText: { ...Typography.body, color: Colors.textPrimary, lineHeight: 22 },
  editedTagSmall: { fontSize: 10, color: Colors.textMuted, fontStyle: "italic", marginTop: 4 },
  topicMeta: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingBottom: 10,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: Spacing.sm,
  },
  upvoteBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
  },
  upvoteBtnActive: { backgroundColor: Colors.primaryLight },
  upvoteCount: { ...Typography.small, fontWeight: "600", color: Colors.textMuted },
  upvoteCountActive: { color: Colors.primary },
  favBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
  },
  favBtnActive: { backgroundColor: Colors.warningLight },
  favLabel: { ...Typography.small, fontWeight: "600", color: Colors.textMuted },
  backBtn: { padding: 6, minWidth: MinTapTarget, minHeight: MinTapTarget, justifyContent: "center" },
  title: { fontSize: 17, fontWeight: "600", color: Colors.textPrimary, flex: 1, paddingTop: 6 },
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 40 },
  list: { padding: Spacing.md, gap: Spacing.sm, paddingBottom: 24 },
  comment: {
    flexDirection: "row",
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 12,
    marginBottom: Spacing.sm,
    gap: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  commentMine: { backgroundColor: Colors.primaryLight, borderColor: "#BFDBFE" },
  commentReply: { marginLeft: 28, marginBottom: Spacing.xs },
  avatar: { width: 36, height: 36, borderRadius: Radius.full, backgroundColor: Colors.textMuted, justifyContent: "center", alignItems: "center" },
  avatarMine: { backgroundColor: Colors.primary },
  avatarText: { color: "#fff", fontWeight: "bold", fontSize: 13 },
  commentHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 4 },
  commentHeaderRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  menuBtn: {
    padding: 6,
    minWidth: 32,
    minHeight: 32,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
    elevation: 10,
  },
  authorLabel: { ...Typography.caption, fontWeight: "600", color: Colors.textPrimary },
  commentDate: { fontSize: 11, color: Colors.textMuted },
  commentText: { ...Typography.label, color: Colors.textPrimary, lineHeight: 20 },
  commentDeleted: { fontStyle: "italic", color: Colors.textMuted },
  editedTag: { fontSize: 10, color: Colors.textMuted, fontStyle: "italic", marginTop: 2 },
  actionsRow: { flexDirection: "row", gap: Spacing.md, marginTop: 6 },
  actionBtn: { flexDirection: "row", alignItems: "center", gap: 4 },
  actionText: { fontSize: 12, color: Colors.textMuted, fontWeight: "500" },
  collapseBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 4,
    marginLeft: 28,
    marginBottom: Spacing.xs,
  },
  collapseText: { ...Typography.small, color: Colors.primary, fontWeight: "600" },
  emptyBox: { alignItems: "center", padding: 50 },
  emptyTitle: { fontSize: 15, fontWeight: "600", color: Colors.textPrimary, marginTop: 10 },
  emptyText: { ...Typography.caption, color: Colors.textSecondary, marginTop: 4 },
  errorText: { color: Colors.danger, fontSize: 14, marginTop: Spacing.sm },
  replyHint: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: Colors.primaryLight,
  },
  replyHintText: { flex: 1, ...Typography.small, color: Colors.textSecondary },
  replyBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    backgroundColor: Colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 10,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: Spacing.sm,
  },
  replyInput: {
    flex: 1,
    backgroundColor: "#F3F4F6",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 10,
    fontSize: 15,
    color: Colors.textPrimary,
    maxHeight: 100,
  },
  sendBtn: { width: MinTapTarget, height: MinTapTarget, borderRadius: Radius.full, backgroundColor: Colors.primary, justifyContent: "center", alignItems: "center" },
  sendBtnDisabled: { opacity: 0.5 },
  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", padding: 20 },
  modalCard: { backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: 18 },
  modalTitle: { ...Typography.h2, color: Colors.textPrimary, marginBottom: 4 },
  modalSubtitle: { ...Typography.caption, color: Colors.textSecondary, marginBottom: Spacing.sm },
  modalInput: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.borderStrong,
    borderRadius: Radius.md,
    padding: 12,
    fontSize: 14,
    color: Colors.textPrimary,
    minHeight: 80,
    textAlignVertical: "top",
  },
  modalActions: { flexDirection: "row", justifyContent: "flex-end", gap: Spacing.sm, marginTop: Spacing.md },
  modalBtnGhost: { paddingVertical: 10, paddingHorizontal: 16 },
  modalBtnGhostText: { color: Colors.textSecondary, fontWeight: "600" },
  modalBtnPrimary: { backgroundColor: Colors.primary, paddingVertical: 10, paddingHorizontal: 18, borderRadius: Radius.md, minWidth: 90, alignItems: "center" },
  modalBtnPrimaryText: { color: "#fff", fontWeight: "700" },
  reasonOption: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 8 },
  reasonOptionActive: {},
  reasonText: { ...Typography.label, color: Colors.textPrimary },
});
