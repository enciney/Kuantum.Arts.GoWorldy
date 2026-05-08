import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../services/api";

interface Comment {
  id: string;
  authorId: string;
  content: string;
  createdAt: string;
}

interface Props {
  topicId: string;
  topicTitle: string;
  onBack: () => void;
}

export function ForumTopicDetailScreen({ topicId, topicTitle, onBack }: Props) {
  const { token, user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reply, setReply] = useState("");
  const [posting, setPosting] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      const data = await api.forum.getComments(topicId, token);
      setComments(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Yüklenemedi.");
    }
  }, [topicId, token]);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  const handlePost = async () => {
    if (!reply.trim() || !token) return;
    setPosting(true);
    try {
      await api.forum.createComment(topicId, reply.trim(), token);
      setReply("");
      await load();
    } catch (e: unknown) {
      Alert.alert(
        "Yorum gönderilemedi",
        e instanceof Error ? e.message : "Bilinmeyen hata"
      );
    } finally {
      setPosting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={26} color="#2563EB" />
        </TouchableOpacity>
        <Text style={styles.title} numberOfLines={2}>
          {topicTitle}
        </Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color="#2563EB" />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Ionicons name="alert-circle" size={32} color="#EF4444" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : (
        <FlatList
          data={comments}
          keyExtractor={(c) => c.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Ionicons name="chatbubble-ellipses-outline" size={42} color="#9CA3AF" />
              <Text style={styles.emptyTitle}>Henüz yorum yok</Text>
              <Text style={styles.emptyText}>İlk yorumu yapan sen ol!</Text>
            </View>
          }
          renderItem={({ item }) => (
            <CommentRow comment={item} isMine={item.authorId === user?.id} />
          )}
        />
      )}

      <View style={styles.replyBar}>
        <TextInput
          style={styles.replyInput}
          placeholder="Yorum yaz..."
          placeholderTextColor="#9CA3AF"
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
          {posting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Ionicons name="send" size={18} color="#fff" />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

function CommentRow({ comment, isMine }: { comment: Comment; isMine: boolean }) {
  const date = new Date(comment.createdAt);
  const dateLabel = date.toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
  const initial = comment.authorId.slice(0, 2).toUpperCase();

  return (
    <View style={[styles.comment, isMine && styles.commentMine]}>
      <View style={[styles.avatar, isMine && styles.avatarMine]}>
        <Text style={styles.avatarText}>{initial}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <View style={styles.commentHeader}>
          <Text style={styles.authorLabel}>{isMine ? "Sen" : "Kullanıcı"}</Text>
          <Text style={styles.commentDate}>{dateLabel}</Text>
        </View>
        <Text style={styles.commentText}>{comment.content}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 8,
    paddingTop: 56,
    paddingBottom: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  backBtn: { padding: 6 },
  title: { fontSize: 17, fontWeight: "600", color: "#111827", flex: 1, paddingTop: 6 },
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 40 },
  list: { padding: 16, gap: 8 },
  comment: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
    gap: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  commentMine: { backgroundColor: "#EFF6FF", borderColor: "#BFDBFE" },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#9CA3AF",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarMine: { backgroundColor: "#2563EB" },
  avatarText: { color: "#fff", fontWeight: "bold", fontSize: 13 },
  commentHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  authorLabel: { fontSize: 13, fontWeight: "600", color: "#111827" },
  commentDate: { fontSize: 11, color: "#9CA3AF" },
  commentText: { fontSize: 14, color: "#111827", lineHeight: 20 },
  emptyBox: { alignItems: "center", padding: 50 },
  emptyTitle: { fontSize: 15, fontWeight: "600", color: "#111827", marginTop: 10 },
  emptyText: { fontSize: 13, color: "#6B7280", marginTop: 4 },
  errorText: { color: "#EF4444", fontSize: 14, marginTop: 8 },
  replyBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 10,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    gap: 8,
  },
  replyInput: {
    flex: 1,
    backgroundColor: "#F3F4F6",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 10,
    fontSize: 15,
    color: "#111827",
    maxHeight: 100,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#2563EB",
    justifyContent: "center",
    alignItems: "center",
  },
  sendBtnDisabled: { opacity: 0.5 },
});
