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
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../services/api";
import { Colors, Typography, Spacing, Radius } from "../../theme";

interface MyTopic {
  id: string;
  title: string;
  status: string;
  isPinned: boolean;
  commentCount: number;
  createdAt: string;
}

const STATUS_LABELS: Record<string, string> = {
  approved: "Yayında",
  pending: "Onay Bekliyor",
  rejected: "Reddedildi",
};

const STATUS_COLORS: Record<string, string> = {
  approved: Colors.secondary,
  pending: Colors.warning,
  rejected: Colors.danger,
};

const STATUS_BG: Record<string, string> = {
  approved: Colors.secondaryLight,
  pending: Colors.warningLight,
  rejected: Colors.dangerLight,
};

export function MyTopicsScreen() {
  const navigation = useNavigation<any>();
  const { token } = useAuth();
  const [topics, setTopics] = useState<MyTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      setError(null);
      const data = await api.users.myTopics(token);
      setTopics(data);
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
        <Text style={styles.title}>Konularım</Text>
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
          data={topics}
          keyExtractor={(t) => t.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
          }
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Ionicons name="document-text-outline" size={48} color={Colors.textMuted} />
              <Text style={styles.emptyTitle}>Henüz konu açmadın</Text>
              <Text style={styles.emptyText}>Forum'dan yeni konu açabilirsin.</Text>
            </View>
          }
          renderItem={({ item }) => <TopicRow topic={item} />}
        />
      )}
    </View>
  );
}

function TopicRow({ topic }: { topic: MyTopic }) {
  const date = new Date(topic.createdAt).toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <View style={styles.row}>
      {topic.isPinned && (
        <View style={styles.pinBadge}>
          <MaterialCommunityIcons name="pin" size={12} color={Colors.warning} />
        </View>
      )}
      <View style={{ flex: 1 }}>
        <Text style={styles.rowTitle} numberOfLines={2}>{topic.title}</Text>
        <View style={styles.rowMeta}>
          <View style={[styles.statusBadge, { backgroundColor: STATUS_BG[topic.status] ?? "#E5E7EB" }]}>
            <Text style={[styles.statusText, { color: STATUS_COLORS[topic.status] ?? Colors.textSecondary }]}>
              {STATUS_LABELS[topic.status] ?? topic.status}
            </Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="chatbubble-outline" size={12} color={Colors.textMuted} />
            <Text style={styles.metaText}>{topic.commentCount}</Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="time-outline" size={12} color={Colors.textMuted} />
            <Text style={styles.metaText}>{date}</Text>
          </View>
        </View>
      </View>
    </View>
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
  pinBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.warningLight,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 2,
  },
  rowTitle: { ...Typography.body, fontWeight: "600", color: Colors.textPrimary, marginBottom: 6 },
  rowMeta: { flexDirection: "row", alignItems: "center", gap: Spacing.sm, flexWrap: "wrap" },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  statusText: { fontSize: 11, fontWeight: "600" },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 3 },
  metaText: { ...Typography.small, color: Colors.textMuted },
  emptyBox: { alignItems: "center", paddingVertical: 60, paddingHorizontal: 32 },
  emptyTitle: { ...Typography.body, fontWeight: "600", color: Colors.textPrimary, marginTop: 12 },
  emptyText: { ...Typography.caption, color: Colors.textSecondary, marginTop: 4 },
  errorText: { ...Typography.body, color: Colors.danger, marginTop: 8 },
});
