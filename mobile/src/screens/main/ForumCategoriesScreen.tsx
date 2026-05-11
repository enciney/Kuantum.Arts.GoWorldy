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
import { Colors, Typography, Spacing, Radius, MinTapTarget } from "../../theme";

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
          <Ionicons name="chevron-back" size={26} color={Colors.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>{countryName}</Text>
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
          data={categories}
          keyExtractor={(c) => c.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons name="folder-open-outline" size={48} color={Colors.textMuted} />
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
              activeOpacity={0.7}
            >
              <View style={styles.iconBox}>
                <Ionicons name="folder" size={22} color={Colors.primary} />
              </View>
              <Text style={styles.rowText}>{item.name}</Text>
              <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.sm,
    paddingTop: 56,
    paddingBottom: 12,
    gap: 4,
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
  title: { ...Typography.h1, color: Colors.textPrimary, flex: 1 },
  list: { paddingHorizontal: Spacing.md, paddingBottom: Spacing.lg },
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: 14,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 12,
    minHeight: MinTapTarget,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    backgroundColor: Colors.primaryLight,
    justifyContent: "center",
    alignItems: "center",
  },
  rowText: { flex: 1, fontSize: 15, fontWeight: "500", color: Colors.textPrimary },
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 40 },
  emptyTitle: { ...Typography.body, fontWeight: "600", color: Colors.textPrimary, marginTop: 12 },
  emptyText: { ...Typography.caption, color: Colors.textSecondary, textAlign: "center", marginTop: 6 },
  errorText: { ...Typography.label, color: Colors.danger, marginTop: Spacing.sm },
});
