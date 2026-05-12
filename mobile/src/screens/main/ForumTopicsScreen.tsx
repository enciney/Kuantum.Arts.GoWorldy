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
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../services/api";
import { Colors, Typography, Spacing, Radius, MinTapTarget } from "../../theme";

interface Topic {
  id: string;
  title: string;
  authorId: string;
  isPinned: boolean;
  status: string;
  createdAt: string;
  commentCount: number;
}

interface TopicWithIsMine extends Topic {
  isMine: boolean;
}

type Filter = "all" | "popular" | "new";

interface Props {
  categoryId: string;
  categoryName: string;
  onBack: () => void;
  onTopicPress: (topicId: string, topicTitle: string) => void;
  onCreateTopic: () => void;
}

export function ForumTopicsScreen({
  categoryId,
  categoryName,
  onBack,
  onTopicPress,
  onCreateTopic,
}: Props) {
  const { token, user } = useAuth();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      setError(null);
      const data = await api.forum.getTopics(categoryId, token);
      setTopics(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Yüklenemedi.");
    }
  }, [categoryId, token]);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  // Approved tüm topic'ler + kullanıcının kendi pending/rejected'ları görünür.
  const visibleTopics: TopicWithIsMine[] = topics
    .filter(
      (t) =>
        t.status === "approved" ||
        (user && t.authorId === user.id)
    )
    .map((t) => ({ ...t, isMine: !!user && t.authorId === user.id }))
    .sort((a, b) => {
      if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
      if (filter === "popular") return b.commentCount - a.commentCount;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={26} color={Colors.primary} />
        </TouchableOpacity>
        <Text style={styles.title} numberOfLines={1}>
          {categoryName}
        </Text>
      </View>

      <View style={styles.filters}>
        {(["all", "new", "popular"] as Filter[]).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterChip, filter === f && styles.filterChipActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f === "all" ? "Tümü" : f === "new" ? "Yeni" : "Popüler"}
            </Text>
          </TouchableOpacity>
        ))}
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
          data={visibleTopics}
          keyExtractor={(t) => t.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Ionicons name="chatbubble-ellipses-outline" size={48} color={Colors.textMuted} />
              <Text style={styles.emptyTitle}>Henüz konu yok</Text>
              <Text style={styles.emptyText}>İlk konuyu sen aç!</Text>
            </View>
          }
          renderItem={({ item }) => (
            <TopicRow topic={item} onPress={() => onTopicPress(item.id, item.title)} />
          )}
        />
      )}

      <TouchableOpacity style={styles.fab} onPress={onCreateTopic}>
        <Ionicons name="add" size={28} color={Colors.surface} />
      </TouchableOpacity>
    </View>
  );
}

function TopicRow({
  topic,
  onPress,
}: {
  topic: TopicWithIsMine;
  onPress: () => void;
}) {
  const date = new Date(topic.createdAt);
  const dateLabel = date.toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "short",
  });

  const showStatusBadge = topic.isMine && topic.status !== "approved";

  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.7}>
      {topic.isPinned && (
        <View style={styles.pinBox}>
          <MaterialCommunityIcons name="pin" size={14} color={Colors.warning} />
        </View>
      )}
      <View style={{ flex: 1 }}>
        <Text style={styles.rowTitle} numberOfLines={2}>
          {topic.title}
        </Text>
        <View style={styles.rowMetaRow}>
          <View style={styles.rowMeta}>
            <Ionicons name="time-outline" size={12} color={Colors.textMuted} />
            <Text style={styles.rowMetaText}>{dateLabel}</Text>
          </View>
          <View style={styles.rowMeta}>
            <Ionicons name="chatbubble-outline" size={12} color={Colors.textMuted} />
            <Text style={styles.rowMetaText}>{topic.commentCount}</Text>
          </View>
          {showStatusBadge && (
            <View
              style={[
                styles.statusBadge,
                topic.status === "pending" && styles.statusPending,
                topic.status === "rejected" && styles.statusRejected,
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  topic.status === "pending" && styles.statusTextPending,
                  topic.status === "rejected" && styles.statusTextRejected,
                ]}
              >
                {topic.status === "pending" ? "Onay bekliyor" : "Reddedildi"}
              </Text>
            </View>
          )}
        </View>
      </View>
      <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.sm,
    paddingTop: 56,
    paddingBottom: 12,
  },
  backBtn: {
    padding: 6,
    minWidth: MinTapTarget,
    minHeight: MinTapTarget,
    justifyContent: "center",
  },
  title: {
    ...Typography.h2,
    color: Colors.textPrimary,
    flex: 1,
  },
  filters: {
    flexDirection: "row",
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
    marginBottom: 12,
  },
  filterChip: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.borderStrong,
    borderRadius: Radius.full,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  filterChipActive: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
  },
  filterText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontWeight: "500",
  },
  filterTextActive: {
    color: Colors.primary,
  },
  list: {
    paddingHorizontal: Spacing.md,
    paddingBottom: 100,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: 14,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 10,
  },
  pinBox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.warningLight,
    justifyContent: "center",
    alignItems: "center",
  },
  rowTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  rowMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginTop: 4,
    flexWrap: "wrap",
  },
  rowMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  rowMetaText: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.full,
    backgroundColor: Colors.border,
  },
  statusPending: {
    backgroundColor: Colors.warningLight,
  },
  statusRejected: {
    backgroundColor: Colors.dangerLight,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  statusTextPending: {
    color: "#92400E",
  },
  statusTextRejected: {
    color: "#991B1B",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  emptyBox: {
    alignItems: "center",
    padding: 60,
  },
  emptyTitle: {
    ...Typography.body,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginTop: 12,
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
  fab: {
    position: "absolute",
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
});
