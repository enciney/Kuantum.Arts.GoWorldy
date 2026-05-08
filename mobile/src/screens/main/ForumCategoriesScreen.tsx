import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../services/api";

interface Props {
  countryId: string;
  countryName: string;
  onBack: () => void;
  onCategoryPress: (categoryId: string, categoryName: string) => void;
}

interface Category {
  id: string;
  countryId: string;
  name: string;
  parentId?: string;
}

export function ForumCategoriesScreen({ countryId, countryName, onBack, onCategoryPress }: Props) {
  const { token } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    api.forum
      .getCategories(countryId, token)
      .then(setCategories)
      .catch((e: unknown) =>
        setError(e instanceof Error ? e.message : "Yüklenemedi.")
      )
      .finally(() => setLoading(false));
  }, [countryId, token]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={26} color="#2563EB" />
        </TouchableOpacity>
        <Text style={styles.title}>{countryName}</Text>
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
          data={categories}
          keyExtractor={(c) => c.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons name="folder-open-outline" size={48} color="#9CA3AF" />
              <Text style={styles.emptyTitle}>Henüz kategori yok</Text>
              <Text style={styles.emptyText}>
                Bu ülke için kategoriler admin tarafından eklenecek.
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.row}
              onPress={() => onCategoryPress(item.id, item.name)}
            >
              <View style={styles.iconBox}>
                <Ionicons name="folder" size={22} color="#2563EB" />
              </View>
              <Text style={styles.rowText}>{item.name}</Text>
              <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        />
      )}
    </View>
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
    gap: 4,
  },
  backBtn: { padding: 6 },
  title: { fontSize: 22, fontWeight: "bold", color: "#111827", flex: 1 },
  list: { paddingHorizontal: 16, paddingBottom: 24 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    gap: 12,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#EFF6FF",
    justifyContent: "center",
    alignItems: "center",
  },
  rowText: { flex: 1, fontSize: 15, fontWeight: "500", color: "#111827" },
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 40 },
  emptyTitle: { fontSize: 16, fontWeight: "600", color: "#111827", marginTop: 12 },
  emptyText: { fontSize: 13, color: "#6B7280", textAlign: "center", marginTop: 6 },
  errorText: { color: "#EF4444", fontSize: 14, marginTop: 8 },
});
