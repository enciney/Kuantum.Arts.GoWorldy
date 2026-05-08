import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
} from "react-native";
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from "@expo/vector-icons";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../services/api";

const USER_TYPE_LABELS = {
  emigrant: "Göç Adayı",
  consultant: "Danışman",
  diaspora: "Yurt Dışında",
};

export function ProfileScreen() {
  const { user, token, logout } = useAuth();
  const [editing, setEditing] = useState(false);
  const [bio, setBio] = useState("");
  const [saving, setSaving] = useState(false);
  const [stats, setStats] = useState({
    topicCount: 0,
    commentCount: 0,
    followingCount: 0,
    completedSteps: 0,
  });

  useEffect(() => {
    if (!token) return;
    Promise.all([
      api.users.me(token).then((u) => setBio(u.bio || "")).catch(() => {}),
      api.users.myStats(token).then(setStats).catch(() => {}),
    ]);
  }, [token]);

  const handleSaveBio = async () => {
    if (!token) return;
    setSaving(true);
    try {
      await api.users.updateMe({ bio }, token);
      setEditing(false);
    } catch (e: unknown) {
      Alert.alert("Hata", e instanceof Error ? e.message : "Kaydedilemedi.");
    } finally {
      setSaving(false);
    }
  };

  const initials = user?.displayName
    ?.split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profil</Text>
        <TouchableOpacity style={styles.settingsBtn}>
          <Ionicons name="settings-outline" size={24} color="#6B7280" />
        </TouchableOpacity>
      </View>

      {/* Avatar + Info */}
      <View style={styles.profileCard}>
        <View style={styles.avatarBox}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials || "?"}</Text>
          </View>
          <TouchableOpacity style={styles.avatarEdit}>
            <Ionicons name="camera" size={16} color="#fff" />
          </TouchableOpacity>
        </View>
        <Text style={styles.displayName}>{user?.displayName}</Text>
        <View style={styles.badgeRow}>
          <View style={styles.badge}>
            <FontAwesome5 name="user-tag" size={11} color="#2563EB" />
            <Text style={styles.badgeText}>Üye</Text>
          </View>
          {user?.role === "admin" && (
            <View style={[styles.badge, styles.badgeAdmin]}>
              <Ionicons name="shield-checkmark" size={12} color="#10B981" />
              <Text style={[styles.badgeText, { color: "#10B981" }]}>Admin</Text>
            </View>
          )}
        </View>
        <Text style={styles.email}>{user?.email}</Text>
      </View>

      {/* Bio */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Hakkımda</Text>
          {!editing && (
            <TouchableOpacity onPress={() => setEditing(true)}>
              <Ionicons name="pencil" size={18} color="#2563EB" />
            </TouchableOpacity>
          )}
        </View>
        {editing ? (
          <>
            <TextInput
              style={styles.bioInput}
              placeholder="Kendinden bahset..."
              placeholderTextColor="#9CA3AF"
              multiline
              value={bio}
              onChangeText={setBio}
            />
            <View style={styles.editActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => {
                  setEditing(false);
                  setBio("");
                }}
              >
                <Text style={styles.cancelBtnText}>İptal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveBtn, saving && { opacity: 0.6 }]}
                onPress={handleSaveBio}
                disabled={saving}
              >
                <Text style={styles.saveBtnText}>{saving ? "..." : "Kaydet"}</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <Text style={styles.bioText}>
            {bio || "Henüz bio eklenmemiş. Düzenle ikonuna dokunarak ekleyebilirsin."}
          </Text>
        )}
      </View>

      {/* Stats */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>İstatistiklerim</Text>
        <View style={styles.statsGrid}>
          <StatItem
            icon="document-text"
            color="#2563EB"
            value={stats.topicCount.toString()}
            label="Konu"
          />
          <StatItem
            icon="chatbubble-ellipses"
            color="#10B981"
            value={stats.commentCount.toString()}
            label="Yorum"
          />
          <StatItem
            icon="checkmark-done"
            color="#F59E0B"
            value={stats.completedSteps.toString()}
            label="Adım"
          />
        </View>
      </View>

      {/* Menu */}
      <View style={styles.menuList}>
        <MenuRow
          icon={<MaterialCommunityIcons name="bell-outline" size={22} color="#6B7280" />}
          label="Bildirim Ayarları"
        />
        <MenuRow
          icon={<MaterialCommunityIcons name="shield-lock-outline" size={22} color="#6B7280" />}
          label="Gizlilik"
        />
        <MenuRow
          icon={<Ionicons name="help-circle-outline" size={22} color="#6B7280" />}
          label="Yardım & Destek"
        />
        <MenuRow
          icon={<Ionicons name="information-circle-outline" size={22} color="#6B7280" />}
          label="Hakkında"
        />
      </View>

      {/* Logout */}
      <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
        <Ionicons name="log-out-outline" size={20} color="#EF4444" />
        <Text style={styles.logoutText}>Çıkış Yap</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function StatItem({
  icon,
  color,
  value,
  label,
}: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  color: string;
  value: string;
  label: string;
}) {
  return (
    <View style={styles.statItem}>
      <Ionicons name={icon} size={22} color={color} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function MenuRow({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <TouchableOpacity style={styles.menuRow}>
      {icon}
      <Text style={styles.menuLabel}>{label}</Text>
      <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  scroll: { padding: 16, paddingTop: 56, paddingBottom: 40 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  headerTitle: { fontSize: 24, fontWeight: "bold", color: "#111827" },
  settingsBtn: { padding: 6 },
  profileCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  avatarBox: { position: "relative", marginBottom: 12 },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: "#2563EB",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: { color: "#fff", fontSize: 32, fontWeight: "bold" },
  avatarEdit: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#2563EB",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  displayName: { fontSize: 20, fontWeight: "bold", color: "#111827" },
  badgeRow: { flexDirection: "row", gap: 8, marginTop: 6 },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9999,
    gap: 4,
  },
  badgeAdmin: { backgroundColor: "#ECFDF5" },
  badgeText: { fontSize: 12, color: "#2563EB", fontWeight: "600" },
  email: { fontSize: 13, color: "#6B7280", marginTop: 4 },
  section: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  sectionTitle: { fontSize: 16, fontWeight: "600", color: "#111827" },
  bioText: { fontSize: 14, color: "#6B7280", lineHeight: 20 },
  bioInput: {
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: "#111827",
    minHeight: 80,
    textAlignVertical: "top",
  },
  editActions: { flexDirection: "row", gap: 8, marginTop: 10, justifyContent: "flex-end" },
  cancelBtn: { paddingHorizontal: 16, paddingVertical: 8 },
  cancelBtnText: { color: "#6B7280", fontWeight: "500" },
  saveBtn: {
    backgroundColor: "#2563EB",
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 8,
  },
  saveBtnText: { color: "#fff", fontWeight: "600" },
  statsGrid: { flexDirection: "row", justifyContent: "space-around", marginTop: 6 },
  statItem: { alignItems: "center", flex: 1 },
  statValue: { fontSize: 20, fontWeight: "bold", color: "#111827", marginTop: 6 },
  statLabel: { fontSize: 12, color: "#6B7280", marginTop: 2 },
  menuList: {
    backgroundColor: "#fff",
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    overflow: "hidden",
  },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    gap: 12,
  },
  menuLabel: { flex: 1, fontSize: 15, color: "#111827" },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: "#FEE2E2",
  },
  logoutText: { color: "#EF4444", fontSize: 15, fontWeight: "600" },
});
