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
import { Colors, Typography, Spacing, Radius } from "../../theme";
import { FavoriteTopic, mergePages, hasMore } from "../../utils/favorites";
import { loadFavorites, FAVORITES_PAGE_SIZE } from "./favoritesHandlers";

export function FavoritesScreen() {
  const navigation = useNavigation<any>();
  const { token } = useAuth();
  const [items, setItems] = useState<FavoriteTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);
  const [canLoadMore, setCanLoadMore] = useState(true);

  const initialLoad = useCallback(async () => {
    if (!token) return;
    try {
      setError(null);
      const data = await loadFavorites(token, 0, FAVORITES_PAGE_SIZE);
      setItems(data);
      setOffset(data.length);
      setCanLoadMore(hasMore(data.length, FAVORITES_PAGE_SIZE));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Yüklenemedi.");
    }
  }, [token]);

  useEffect(() => {
    initialLoad().finally(() => setLoading(false));
  }, [initialLoad]);

  const onRefresh = async () => {
    if (!token) return;
    setRefreshing(true);
    try {
      setError(null);
      const data = await loadFavorites(token, 0, FAVORITES_PAGE_SIZE);
      setItems(data);
      setOffset(data.length);
      setCanLoadMore(hasMore(data.length, FAVORITES_PAGE_SIZE));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Yüklenemedi.");
    } finally {
      setRefreshing(false);
    }
  };

  const onEndReached = async () => {
    if (!token || loadingMore || !canLoadMore || loading) return;
    setLoadingMore(true);
    try {
      const next = await loadFavorites(token, offset, FAVORITES_PAGE_SIZE);
      setItems((prev) => mergePages(prev, next));
      setOffset((prev) => prev + next.length);
      setCanLoadMore(hasMore(next.length, FAVORITES_PAGE_SIZE));
    } catch (_e) {
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={26} color={Colors.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>Favorilerim</Text>
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
          <TouchableOpacity
            style={styles.retryBtn}
            onPress={() => {
              setLoading(true);
              initialLoad().finally(() => setLoading(false));
            }}
          >
            <Text style={styles.retryBtnText}>Tekrar Dene</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(t) => t.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
          }
          onEndReached={onEndReached}
          onEndReachedThreshold={0.4}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Ionicons name="bookmark-outline" size={48} color={Colors.textMuted} />
              <Text style={styles.emptyTitle}>Henüz favori konunuz yok</Text>
              <Text style={styles.emptyText}>
                Bir konuya 🔖 ikonuyla ekleyebilirsiniz.
              </Text>
            </View>
          }
          ListFooterComponent={
            loadingMore ? (
              <View style={styles.footer}>
                <ActivityIndicator color={Colors.primary} />
              </View>
            ) : null
          }
          renderItem={({ item }) => (
            <FavoriteRow
              topic={item}
              onPress={() =>
                navigation.getParent()?.navigate("Forum", {
                  openTopicId: item.id,
                  openTopicTitle: item.title,
                })
              }
            />
          )}
        />
      )}
    </View>
  );
}

function FavoriteRow({ topic, onPress }: { topic: FavoriteTopic; onPress: () => void }) {
  const date = new Date(topic.createdAt).toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.iconBox}>
        <Ionicons name="bookmark" size={16} color={Colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowTitle} numberOfLines={2}>
          {topic.title}
        </Text>
        <View style={styles.rowMeta}>
          <View style={styles.metaItem}>
            <Ionicons name="chatbubble-outline" size={12} color={Colors.textMuted} />
            <Text style={styles.metaText}>{topic.commentCount}</Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="time-outline" size={12} color={Colors.textMuted} />
            <Text style={styles.metaText}>{date}</Text>
          </View>
        </View>
        <Text style={styles.detailLink}>Detayı gör</Text>
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
  list: { padding: Spacing.md, paddingBottom: 40, flexGrow: 1 },
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
  rowTitle: { ...Typography.body, fontWeight: "600", color: Colors.textPrimary, marginBottom: 6 },
  rowMeta: { flexDirection: "row", alignItems: "center", gap: Spacing.sm, flexWrap: "wrap" },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 3 },
  metaText: { ...Typography.small, color: Colors.textMuted },
  detailLink: { ...Typography.small, color: Colors.primary, fontWeight: "600", marginTop: 6 },
  emptyBox: { alignItems: "center", paddingVertical: 60, paddingHorizontal: 32 },
  emptyTitle: { ...Typography.body, fontWeight: "600", color: Colors.textPrimary, marginTop: 12 },
  emptyText: { ...Typography.caption, color: Colors.textSecondary, marginTop: 4, textAlign: "center" },
  errorText: { ...Typography.body, color: Colors.danger, marginTop: 8 },
  retryBtn: {
    marginTop: Spacing.md,
    paddingHorizontal: 18,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.primary,
    borderRadius: Radius.sm,
  },
  retryBtnText: { color: Colors.surface, fontWeight: "600" },
  footer: { paddingVertical: Spacing.md, alignItems: "center" },
});
