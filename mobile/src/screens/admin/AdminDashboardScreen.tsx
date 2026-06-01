import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useAuth } from "../../context/AuthContext";
import { api, AdminDashboardStats } from "../../services/api";
import { Colors } from "../../theme";
import { loadAdminDashboard } from "./adminDashboardHandlers";
import { AdminStackParamList } from "../../navigation/AdminNavigator";
import { AdminLayout } from "./AdminLayout";

type AdminDashboardNavProp = NativeStackNavigationProp<AdminStackParamList, "AdminDashboard">;

export function AdminDashboardScreen() {
  const { token } = useAuth();
  const navigation = useNavigation<AdminDashboardNavProp>();
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        if (!token) return;
        setLoading(true);
        const result = await loadAdminDashboard(token, api.admin);
        if (!active) return;
        setStats(result.stats);
        setError(result.error);
        setLoading(false);
      })();
      return () => { active = false; };
    }, [token])
  );

  return (
    <AdminLayout title="Dashboard">
      {loading ? (
        <ActivityIndicator color={Colors.primary} style={styles.loader} />
      ) : error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : (
        <>
          {/* Stats grid */}
          <View style={styles.statsGrid}>
            <StatCard label="Toplam Kullanıcı" value={stats?.totalUsers ?? 0} color="#3B82F6" icon="👤" />
            <StatCard label="Toplam Konu" value={stats?.totalTopics ?? 0} color="#10B981" icon="💬" />
            <StatCard label="Toplam Yorum" value={stats?.totalComments ?? 0} color="#F59E0B" icon="✍️" />
            <StatCard label="Ülke Sayısı" value={stats?.totalCountries ?? 0} color="#8B5CF6" icon="🌍" />
          </View>

          {/* Quick links */}
          <Text style={styles.sectionTitle}>Hızlı Bağlantılar</Text>
          <View style={styles.linkList}>
            <LinkRow label="Konu Onay Kuyruğu →" onPress={() => navigation.navigate("AdminTopics")} />
            <LinkRow label="Kullanıcı Yönetimi →" onPress={() => navigation.navigate("AdminUsers")} />
            <LinkRow label="Premium Planlar →" onPress={() => navigation.navigate("AdminPremium")} />
            <LinkRow label="Sistem Ayarları →" onPress={() => navigation.navigate("AdminSettings")} />
          </View>
        </>
      )}
    </AdminLayout>
  );
}

function StatCard({ label, value, color, icon }: { label: string; value: number; color: string; icon: string }) {
  return (
    <View style={[styles.card, { borderTopColor: color }]}>
      <Text style={styles.cardIcon}>{icon}</Text>
      <Text style={[styles.cardValue, { color }]}>{value.toLocaleString("tr-TR")}</Text>
      <Text style={styles.cardLabel}>{label}</Text>
    </View>
  );
}

function LinkRow({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.linkRow} onPress={onPress} activeOpacity={0.7}>
      <Text style={styles.linkText}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  loader: { marginTop: 32 },
  errorBox: { alignItems: "center", padding: 32 },
  errorText: { fontSize: 14, color: "#DC2626", textAlign: "center" },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 24,
  },
  card: {
    width: "47.5%",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderTopWidth: 4,
    borderTopColor: "#3B82F6",
    padding: 16,
    alignItems: "center",
    gap: 4,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  cardIcon: { fontSize: 26, marginBottom: 2 },
  cardValue: { fontSize: 28, fontWeight: "700", lineHeight: 32 },
  cardLabel: { fontSize: 12, color: "#64748B", textAlign: "center" },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#1E293B", marginBottom: 10 },
  linkList: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  linkRow: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  linkText: { fontSize: 14, color: "#3B82F6", fontWeight: "500" },
});
