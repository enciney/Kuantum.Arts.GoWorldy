import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../services/api";
import { ForumCategoriesScreen } from "./ForumCategoriesScreen";
import { ForumTopicsScreen } from "./ForumTopicsScreen";
import { ForumTopicDetailScreen } from "./ForumTopicDetailScreen";
import { CreateTopicScreen } from "./CreateTopicScreen";

interface Country {
  id: string;
  name: string;
  code: string;
}

const FLAG_MAP: Record<string, string> = {
  US: "🇺🇸", DE: "🇩🇪", GB: "🇬🇧", CA: "🇨🇦",
  AU: "🇦🇺", NL: "🇳🇱", FR: "🇫🇷", TR: "🇹🇷",
};

type ScreenView =
  | { kind: "countries" }
  | { kind: "categories"; country: Country }
  | { kind: "topics"; country: Country; categoryId: string; categoryName: string }
  | {
      kind: "topic-detail";
      country: Country;
      categoryId: string;
      categoryName: string;
      topicId: string;
      topicTitle: string;
    }
  | {
      kind: "create-topic";
      country: Country;
      categoryId: string;
      categoryName: string;
    };

export function ForumScreen() {
  const { token } = useAuth();
  const navigation = useNavigation<any>();

  const navigateToPremium = () => {
    navigation.navigate("Home", { screen: "Premium" });
  };
  const [countries, setCountries] = useState<Country[]>([]);
  const [filtered, setFiltered] = useState<Country[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<ScreenView>({ kind: "countries" });

  useEffect(() => {
    if (!token) return;
    api.forum
      .getCountries(token)
      .then((data) => {
        setCountries(data);
        setFiltered(data);
      })
      .catch((e: unknown) =>
        setError(e instanceof Error ? e.message : "Yüklenemedi.")
      )
      .finally(() => setLoading(false));
  }, [token]);

  const handleSearch = (text: string) => {
    setSearch(text);
    setFiltered(
      countries.filter((c) => c.name.toLowerCase().includes(text.toLowerCase()))
    );
  };

  if (view.kind === "create-topic") {
    return (
      <CreateTopicScreen
        categoryId={view.categoryId}
        categoryName={view.categoryName}
        onCancel={() =>
          setView({
            kind: "topics",
            country: view.country,
            categoryId: view.categoryId,
            categoryName: view.categoryName,
          })
        }
        onCreated={() =>
          setView({
            kind: "topics",
            country: view.country,
            categoryId: view.categoryId,
            categoryName: view.categoryName,
          })
        }
        onNavigatePremium={navigateToPremium}
      />
    );
  }

  if (view.kind === "topic-detail") {
    return (
      <ForumTopicDetailScreen
        topicId={view.topicId}
        topicTitle={view.topicTitle}
        onBack={() =>
          setView({
            kind: "topics",
            country: view.country,
            categoryId: view.categoryId,
            categoryName: view.categoryName,
          })
        }
      />
    );
  }

  if (view.kind === "topics") {
    return (
      <ForumTopicsScreen
        categoryId={view.categoryId}
        categoryName={view.categoryName}
        onBack={() => setView({ kind: "categories", country: view.country })}
        onTopicPress={(topicId, topicTitle) =>
          setView({
            kind: "topic-detail",
            country: view.country,
            categoryId: view.categoryId,
            categoryName: view.categoryName,
            topicId,
            topicTitle,
          })
        }
        onCreateTopic={() =>
          setView({
            kind: "create-topic",
            country: view.country,
            categoryId: view.categoryId,
            categoryName: view.categoryName,
          })
        }
      />
    );
  }

  if (view.kind === "categories") {
    return (
      <ForumCategoriesScreen
        countryId={view.country.id}
        countryName={view.country.name}
        onBack={() => setView({ kind: "countries" })}
        onCategoryPress={(categoryId, categoryName) => {
          setView({ kind: "topics", country: view.country, categoryId, categoryName });
        }}
      />
    );
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Ionicons name="alert-circle" size={36} color="#EF4444" />
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Forum</Text>
      <View style={styles.searchBox}>
        <Ionicons name="search" size={18} color="#9CA3AF" />
        <TextInput
          style={styles.search}
          placeholder="Ülke ara..."
          placeholderTextColor="#9CA3AF"
          value={search}
          onChangeText={handleSearch}
        />
      </View>
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => setView({ kind: "categories", country: item })}
          >
            <Text style={styles.flag}>{FLAG_MAP[item.code] ?? "🌍"}</Text>
            <Text style={styles.countryName}>{item.name}</Text>
            <View style={styles.cardFooter}>
              <Ionicons name="chatbubbles-outline" size={14} color="#6B7280" />
              <Text style={styles.cardFooterText}>Forum'a git</Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.center}>
            <Text style={styles.emptyText}>Sonuç bulunamadı.</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 40 },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#111827",
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 12,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 12,
    paddingHorizontal: 12,
    marginHorizontal: 16,
    marginBottom: 12,
    gap: 8,
  },
  search: { flex: 1, paddingVertical: 12, fontSize: 15, color: "#111827" },
  list: { paddingHorizontal: 16, paddingBottom: 24 },
  row: { justifyContent: "space-between", marginBottom: 12 },
  card: {
    flex: 0.48,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 18,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  flag: { fontSize: 36, marginBottom: 6 },
  countryName: { fontSize: 14, fontWeight: "600", color: "#111827", textAlign: "center", marginBottom: 8 },
  cardFooter: { flexDirection: "row", alignItems: "center", gap: 4 },
  cardFooterText: { fontSize: 11, color: "#6B7280" },
  errorText: { color: "#EF4444", fontSize: 15, marginTop: 8, textAlign: "center" },
  emptyText: { color: "#6B7280", fontSize: 15 },
});
