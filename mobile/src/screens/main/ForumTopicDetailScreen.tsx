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
import { Colors, Typography, Spacing, Radius, MinTapTarget } from "../../theme";

interface Comment {
  id: string;
  authorId: string;
  authorDisplayName: string;
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
          <Ionicons name="chevron-back" size={26} color={Colors.primary} />
        </TouchableOpacity>
        <Text style={styles.title} numberOfLines={2}>
          {topicTitle}
        </Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.primary} />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Ionicons name="alert-circle" size={32} color={Colors.danger} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : (
        <FlatList
          data={comments}
          keyExtractor={(c) => c.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Ionicons name="chatbubble-ellipses-outline" size={42} color={Colors.textMuted} />
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
          placeholderTextColor={Colors.textMuted}
          value={reply}
          onChangeText={setReply}
          multiline
          maxLength={1000}
        />
        <TouchableOpacity
          style={[
            styles.sendBtn,
            (!reply.trim() || posting) && styles.sendBtnDisabled,
          ]}
          onPress={handlePost}
          disabled={!reply.trim() || posting}
        >
          {posting ? (
            <ActivityIndicator size="small" color={Colors.surface} />
          ) : (
            <Ionicons name="send" size={18} color={Colors.surface} />
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
  const name = isMine ? "Sen" : comment.authorDisplayName;
  const initial = name.slice(0, 2).toUpperCase();

  return (
    <View style={[styles.comment, isMine && styles.commentMine]}>
      <View style={[styles.avatar, isMine && styles.avatarMine]}>
        <Text style={styles.avatarText}>{initial}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <View style={styles.commentHeader}>
          <Text style={styles.authorLabel}>{name}</Text>
          <Text style={styles.commentDate}>{dateLabel}</Text>
        </View>
        <Text style={styles.commentText}>{comment.content}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: Spacing.sm,
    paddingTop: 56,
    paddingBottom: 12,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: {
    padding: 6,
    minWidth: MinTapTarget,
    minHeight: MinTapTarget,
    justifyContent: "center",
  },
  title: {
    fontSize: 17,
    fontWeight: "600",
    color: Colors.textPrimary,
    flex: 1,
    paddingTop: 6,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  list: {
    padding: Spacing.md,
    gap: Spacing.sm,
  },
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
  commentMine: {
    backgroundColor: Colors.primaryLight,
    borderColor: "#BFDBFE",
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: Radius.full,
    backgroundColor: Colors.textMuted,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarMine: {
    backgroundColor: Colors.primary,
  },
  avatarText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 13,
  },
  commentHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  authorLabel: {
    ...Typography.caption,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  commentDate: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  commentText: {
    ...Typography.label,
    color: Colors.textPrimary,
    lineHeight: 20,
  },
  emptyBox: {
    alignItems: "center",
    padding: 50,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginTop: 10,
  },
  emptyText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  errorText: {
    color: Colors.danger,
    fontSize: 14,
    marginTop: Spacing.sm,
  },
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
  sendBtn: {
    width: MinTapTarget,
    height: MinTapTarget,
    borderRadius: Radius.full,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  sendBtnDisabled: {
    opacity: 0.5,
  },
});
