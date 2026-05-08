import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../services/api";
import { HomeStackParamList } from "../../navigation/AppNavigator";

type HomeNav = NativeStackNavigationProp<HomeStackParamList, "HomeMain">;

export function HomeScreen() {
  const { user, token, logout } = useAuth();
  const navigation = useNavigation<HomeNav>();
  const [stats, setStats] = useState({ countries: 0, completedSteps: 0, totalSteps: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    Promise.all([
      api.forum.getCountries(token).catch(() => []),
      api.guide.getProgress(token).catch(() => []),
      api.guide.getSteps("1", token).catch(() => []),
    ])
      .then(([countries, progress, steps]) => {
        setStats({
          countries: countries.length,
          completedSteps: progress.length,
          totalSteps: steps.length,
        });
      })
      .finally(() => setLoading(false));
  }, [token]);

  const completionPct =
    stats.totalSteps > 0 ? Math.round((stats.completedSteps / stats.totalSteps) * 100) : 0;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Header */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.greeting}>Merhaba, {user?.displayName?.split(" ")[0]}! 👋</Text>
          <Text style={styles.subtitle}>Göç yolculuğuna devam edelim</Text>
        </View>
        <TouchableOpacity
          onPress={() => navigation.navigate("Notifications")}
          style={styles.iconBtn}
          activeOpacity={0.6}
        >
          <Ionicons name="notifications-outline" size={24} color="#6B7280" />
        </TouchableOpacity>
        <TouchableOpacity onPress={logout} style={styles.iconBtn}>
          <Ionicons name="log-out-outline" size={24} color="#6B7280" />
        </TouchableOpacity>
      </View>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <StatCard
          icon={<MaterialCommunityIcons name="progress-check" size={24} color="#10B981" />}
          value={`%${completionPct}`}
          label="İlerleme"
          onPress={() => navigation.getParent()?.navigate("Guide")}
        />
        <StatCard
          icon={<FontAwesome5 name="globe-americas" size={20} color="#2563EB" />}
          value={stats.countries.toString()}
          label="Ülke"
          onPress={() => navigation.getParent()?.navigate("Forum")}
        />
        <StatCard
          icon={<Ionicons name="checkmark-done" size={24} color="#F59E0B" />}
          value={stats.completedSteps.toString()}
          label="Tamamlanan"
          onPress={() => navigation.getParent()?.navigate("Guide")}
        />
      </View>

      {/* Continue Guide Card */}
      <TouchableOpacity
        style={styles.guideCard}
        activeOpacity={0.85}
        onPress={() => navigation.getParent()?.navigate("Guide")}
      >
        <View style={styles.guideCardHeader}>
          <MaterialCommunityIcons name="map-marker-path" size={28} color="#fff" />
          <Text style={styles.guideCardTitle}>Rehberime Devam Et</Text>
        </View>
        <Text style={styles.guideCardText}>
          {stats.completedSteps} / {stats.totalSteps} adım tamamlandı
        </Text>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${completionPct}%` }]} />
        </View>
      </TouchableOpacity>

      {/* Quick Actions */}
      <Text style={styles.sectionTitle}>Hızlı Erişim</Text>
      <View style={styles.actionRow}>
        <ActionCard
          icon={<Ionicons name="chatbubbles" size={28} color="#2563EB" />}
          label="Forum"
          color="#EFF6FF"
          onPress={() => navigation.getParent()?.navigate("Forum")}
        />
        <ActionCard
          icon={<MaterialCommunityIcons name="bookmark-multiple" size={28} color="#10B981" />}
          label="Rehberim"
          color="#ECFDF5"
          onPress={() => navigation.getParent()?.navigate("Guide")}
        />
        <ActionCard
          icon={<Ionicons name="notifications" size={28} color="#F59E0B" />}
          label="Bildirimler"
          color="#FFFBEB"
          onPress={() => navigation.navigate("Notifications")}
        />
        <ActionCard
          icon={<MaterialCommunityIcons name="crown" size={28} color="#8B5CF6" />}
          label="Premium"
          color="#F5F3FF"
          onPress={() => navigation.navigate("Premium")}
        />
      </View>

      {/* Activity Feed */}
      <Text style={styles.sectionTitle}>Son Aktiviteler</Text>
      {loading ? (
        <ActivityIndicator color="#2563EB" style={{ marginVertical: 20 }} />
      ) : (
        <TouchableOpacity
          style={styles.activityCard}
          onPress={() => navigation.getParent()?.navigate("Forum")}
          activeOpacity={0.7}
        >
          <Ionicons name="information-circle-outline" size={32} color="#9CA3AF" />
          <Text style={styles.activityEmptyTitle}>Henüz aktivite yok</Text>
          <Text style={styles.activityEmptyText}>
            Forum'da bir konuya yorum yap veya bir rehber adımını tamamla.
          </Text>
        </TouchableOpacity>
      )}

      {/* Premium Banner */}
      <TouchableOpacity
        style={styles.premiumBanner}
        onPress={() => navigation.navigate("Premium")}
        activeOpacity={0.85}
      >
        <MaterialCommunityIcons name="crown" size={32} color="#fff" />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.premiumTitle}>Premium'a Geç</Text>
          <Text style={styles.premiumText}>
            Sınırsız konu, reklamsız deneyim — aylık 250 TL
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={24} color="#fff" />
      </TouchableOpacity>
    </ScrollView>
  );
}

function StatCard({
  icon,
  value,
  label,
  onPress,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
  onPress?: () => void;
}) {
  return (
    <TouchableOpacity style={styles.statCard} onPress={onPress} activeOpacity={0.7}>
      {icon}
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

function ActionCard({
  icon,
  label,
  color,
  onPress,
}: {
  icon: React.ReactNode;
  label: string;
  color: string;
  onPress?: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.actionCard, { backgroundColor: color }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {icon}
      <Text style={styles.actionLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  scrollContent: { padding: 16, paddingTop: 56, paddingBottom: 40 },
  header: { flexDirection: "row", alignItems: "center", marginBottom: 24 },
  greeting: { fontSize: 22, fontWeight: "bold", color: "#111827" },
  subtitle: { fontSize: 14, color: "#6B7280", marginTop: 2 },
  iconBtn: { padding: 8 },
  statsRow: { flexDirection: "row", gap: 8, marginBottom: 20 },
  statCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  statValue: { fontSize: 18, fontWeight: "bold", color: "#111827", marginTop: 6 },
  statLabel: { fontSize: 12, color: "#6B7280", marginTop: 2 },
  guideCard: {
    backgroundColor: "#2563EB",
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  guideCardHeader: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 8 },
  guideCardTitle: { fontSize: 18, fontWeight: "bold", color: "#fff" },
  guideCardText: { fontSize: 13, color: "#DBEAFE", marginBottom: 12 },
  progressTrack: {
    height: 8,
    backgroundColor: "rgba(255,255,255,0.3)",
    borderRadius: 9999,
    overflow: "hidden",
  },
  progressFill: { height: 8, backgroundColor: "#fff", borderRadius: 9999 },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 12,
    marginTop: 4,
  },
  actionRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 24 },
  actionCard: {
    width: "48%",
    borderRadius: 16,
    padding: 18,
    alignItems: "center",
    gap: 8,
  },
  actionLabel: { fontSize: 14, fontWeight: "600", color: "#111827" },
  activityCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 24,
  },
  activityEmptyTitle: { fontSize: 15, fontWeight: "600", color: "#111827", marginTop: 8 },
  activityEmptyText: {
    fontSize: 13,
    color: "#6B7280",
    textAlign: "center",
    marginTop: 4,
    lineHeight: 18,
  },
  premiumBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#8B5CF6",
    borderRadius: 16,
    padding: 18,
  },
  premiumTitle: { fontSize: 16, fontWeight: "bold", color: "#fff" },
  premiumText: { fontSize: 13, color: "#EDE9FE", marginTop: 2 },
});
