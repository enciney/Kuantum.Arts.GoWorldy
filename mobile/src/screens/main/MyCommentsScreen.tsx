import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../services/api";
import { Colors, Typography, Spacing, Radius } from "../../theme";

interface MyComment {
  id: string;
  topicId: string;
  topicTitle: string;
  content: string;
  createdAt: string;
}

export function MyCommentsScreen() {
  const navigation = useNavigation<any>();
  const { token } = useAuth();
  const [comments, setComments] = useState<MyComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      setError(null);
      const data = await api.users.myComments(token);
      setComments(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Yüklenemedi.");
    }
  }, [token]);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={26} color={Colors.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>Yorumlarım</Text>
        <View style={{ width: 38 }} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.primary} />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={32} color={Colors.danger} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : (
        <FlatList
          data={comments}
          keyExtractor={(c) => c.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
          }
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Ionicons name="chatbubble-ellipses-outline" size={48} color={Colors.textMuted} />
              <Text style={styles.emptyTitle}>Henüz yorum yapmadın</Text>
              <Text style={styles.emptyText}>Forum konularına yorum yaparak topluluğa katıl.</Text>
            </View>
          }
          renderItem={({ item }) => <CommentRow comment={item} onPress={() => navigation.getParent()?.navigate("Forum", { openTopicId: item.topicId, openTopicTitle: item.topicTitle })} />}
        />
      )}
    </View>
  );
}

function CommentRow({ comment, onPress }: { comment: MyComment; onPress: () => void }) {
  const date = new Date(comment.createdAt).toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.iconBox}>
        <Ionicons name="chatbubble" size={16} color={Colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.topicTitle} numberOfLines={1}>
          {comment.topicTitle}
        </Text>
        <Text style={styles.content} numberOfLines={3}>
          {comment.content}
        </Text>
        <View style={styles.metaRow}>
          <Ionicons name="time-outline" size={12} color={Colors.textMuted} />
          <Text style={styles.metaText}>{date}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.sm,
    paddingTop: 56,
    paddingBottom: Spacing.md,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: { padding: Spacing.xs, minWidth: 38, minHeight: 44, justifyContent: "center" },
  title: { ...Typography.h2, color: Colors.textPrimary },
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 40 },
  list: { padding: Spacing.md, paddingBottom: 40 },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.sm,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primaryLight,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 2,
  },
  topicTitle: {
    ...Typography.small,
    color: Colors.primary,
    fontWeight: "600",
    marginBottom: 4,
  },
  content: {
    ...Typography.label,
    color: Colors.textPrimary,
    lineHeight: 20,
    marginBottom: 6,
  },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaText: { ...Typography.small, color: Colors.textMuted },
  emptyBox: { alignItems: "center", paddingVertical: 60, paddingHorizontal: 32 },
  emptyTitle: { ...Typography.body, fontWeight: "600", color: Colors.textPrimary, marginTop: 12 },
  emptyText: { ...Typography.caption, color: Colors.textSecondary, marginTop: 4, textAlign: "center" },
  errorText: { ...Typography.body, color: Colors.danger, marginTop: 8 },
});
