import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useAuth } from "../../context/AuthContext";
import { AdminStackParamList } from "../../navigation/AdminNavigator";

type AdminNavProp = NativeStackNavigationProp<AdminStackParamList>;

const NAV_ITEMS: { screen: keyof AdminStackParamList; label: string }[] = [
  { screen: "AdminDashboard", label: "Dashboard" },
  { screen: "AdminTopics", label: "Forum Moderasyonu" },
  { screen: "AdminUsers", label: "Kullanıcılar" },
  { screen: "AdminPremium", label: "Premium" },
  { screen: "AdminSettings", label: "Ayarlar" },
];

export function AdminLayout({
  children,
  title,
  headerAction,
}: {
  children: React.ReactNode;
  title: string;
  headerAction?: React.ReactNode;
}) {
  const navigation = useNavigation<AdminNavProp>();
  const route = useRoute();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.root}>
        {/* ── Sidebar ─────────────────────────────────────────────────── */}
        <View style={styles.sidebar}>
          {/* Brand */}
          <View style={styles.brand}>
            <Text style={styles.brandIcon}>🌍</Text>
            <Text style={styles.brandName}>GoWorldy</Text>
            <View style={styles.brandBadge}>
              <Text style={styles.brandBadgeText}>Admin</Text>
            </View>
          </View>

          {/* Nav items */}
          <ScrollView style={styles.nav} showsVerticalScrollIndicator={false}>
            {NAV_ITEMS.map((item) => {
              const isActive = route.name === item.screen;
              return (
                <TouchableOpacity
                  key={item.screen}
                  style={[styles.navItem, isActive && styles.navItemActive]}
                  onPress={() => navigation.navigate(item.screen)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.navItemText, isActive && styles.navItemTextActive]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Footer */}
          <View style={styles.sidebarFooter}>
            <Text style={styles.sidebarUser} numberOfLines={1}>
              {user?.displayName ?? user?.email ?? ""}
            </Text>
            <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
              <Text style={styles.logoutBtnText}>Çıkış</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Main content ──────────────────────────────────────────── */}
        <View style={styles.main}>
          <View style={styles.mainHeader}>
            <Text style={styles.mainTitle}>{title}</Text>
            {headerAction ?? null}
          </View>
          <ScrollView style={styles.mainScroll} contentContainerStyle={styles.mainContent}>
            {children}
          </ScrollView>
        </View>
      </View>
    </SafeAreaView>
  );
}

const SIDEBAR_WIDTH = 200;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#1E293B",
  },
  root: {
    flex: 1,
    flexDirection: "row",
  },
  // ─── Sidebar ────────────────────────────────────────────────────────────────
  sidebar: {
    width: SIDEBAR_WIDTH,
    backgroundColor: "#1E293B",
    flexDirection: "column",
    paddingTop: 8,
  },
  brand: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#334155",
    gap: 6,
    flexWrap: "nowrap",
  },
  brandIcon: { fontSize: 18 },
  brandName: { color: "#F8FAFC", fontWeight: "700", fontSize: 14 },
  brandBadge: {
    backgroundColor: "#3B82F6",
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  brandBadgeText: { color: "#fff", fontSize: 9, fontWeight: "700" },
  nav: {
    flex: 1,
    paddingHorizontal: 8,
    paddingTop: 12,
  },
  navItem: {
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginBottom: 2,
  },
  navItemActive: {
    backgroundColor: "#3B82F6",
  },
  navItemText: {
    color: "#94A3B8",
    fontSize: 13,
    fontWeight: "500",
  },
  navItemTextActive: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  sidebarFooter: {
    borderTopWidth: 1,
    borderTopColor: "#334155",
    padding: 12,
    gap: 8,
  },
  sidebarUser: {
    fontSize: 11,
    color: "#94A3B8",
  },
  logoutBtn: {
    backgroundColor: "#EF4444",
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    alignItems: "center",
  },
  logoutBtnText: { color: "#fff", fontSize: 12, fontWeight: "600" },

  // ─── Main ───────────────────────────────────────────────────────────────────
  main: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  mainHeader: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
  },
  mainTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1E293B",
  },
  mainScroll: {
    flex: 1,
  },
  mainContent: {
    padding: 16,
    paddingBottom: 40,
  },
});
