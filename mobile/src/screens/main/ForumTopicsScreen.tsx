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

interface Topic {
  id: string;
  title: string;
  authorId: string;
  isPinned: boolean;
  status: string;
  createdAt: string;
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
      if (filter === "new") {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      return 0;
    });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={26} color="#2563EB" />
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
          <ActivityIndicator color="#2563EB" />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Ionicons name="alert-circle" size={32} color="#EF4444" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : (
        <FlatList
          data={visibleTopics}
          keyExtractor={(t) => t.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2563EB" />
          }
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Ionicons name="chatbubble-ellipses-outline" size={48} color="#9CA3AF" />
              <Text style={styles.emptyTitle}>Henüz konu yok</Text>
              <Text style={styles.emptyText}>İlk konuyu sen aç!</Text>
            </View>
          }
          renderItem={({ item }) => <TopicRow topic={item} onPress={() => onTopicPress(item.id, item.title)} />}
        />
      )}

      <TouchableOpacity style={styles.fab} onPress={onCreateTopic}>
        <Ionicons name="add" size={28} color="#fff" />
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
          <MaterialCommunityIcons name="pin" size={14} color="#F59E0B" />
        </View>
      )}
      <View style={{ flex: 1 }}>
        <Text style={styles.rowTitle} numberOfLines={2}>
          {topic.title}
        </Text>
        <View style={styles.rowMetaRow}>
          <View style={styles.rowMeta}>
            <Ionicons name="time-outline" size={12} color="#9CA3AF" />
            <Text style={styles.rowMetaText}>{dateLabel}</Text>
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
                  topic.status === "pending" && { color: "#92400E" },
                  topic.status === "rejected" && { color: "#991B1B" },
                ]}
              >
                {topic.status === "pending" ? "Onay bekliyor" : "Reddedildi"}
              </Text>
            </View>
          )}
        </View>
      </View>
      <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingTop: 56,
    paddingBottom: 12,
  },
  backBtn: { padding: 6 },
  title: { fontSize: 20, fontWeight: "bold", color: "#111827", flex: 1 },
  filters: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 12,
  },
  filterChip: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 9999,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  filterChipActive: { backgroundColor: "#EFF6FF", borderColor: "#2563EB" },
  filterText: { fontSize: 13, color: "#6B7280", fontWeight: "500" },
  filterTextActive: { color: "#2563EB" },
  list: { paddingHorizontal: 16, paddingBottom: 100 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    gap: 10,
  },
  pinBox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#FEF3C7",
    justifyContent: "center",
    alignItems: "center",
  },
  rowTitle: { fontSize: 15, fontWeight: "600", color: "#111827" },
  rowMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
    flexWrap: "wrap",
  },
  rowMeta: { flexDirection: "row", alignItems: "center", gap: 4 },
  rowMetaText: { fontSize: 11, color: "#9CA3AF" },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 9999,
    backgroundColor: "#E5E7EB",
  },
  statusPending: { backgroundColor: "#FEF3C7" },
  statusRejected: { backgroundColor: "#FEE2E2" },
  statusText: { fontSize: 10, fontWeight: "600", color: "#374151" },
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 40 },
  emptyBox: { alignItems: "center", padding: 60 },
  emptyTitle: { fontSize: 16, fontWeight: "600", color: "#111827", marginTop: 12 },
  emptyText: { fontSize: 13, color: "#6B7280", marginTop: 4 },
  errorText: { color: "#EF4444", fontSize: 14, marginTop: 8 },
  fab: {
    position: "absolute",
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#2563EB",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
});
