import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  Linking,
} from "react-native";
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../services/api";
import { Colors, Typography, Spacing, Radius, MinTapTarget } from "../../theme";
import { PrivacyScreen } from "./PrivacyScreen";

const USER_TYPE_LABELS: Record<string, string> = {
  emigrant: "Göç Adayı",
  consultant: "Danışman",
  diaspora: "Yurt Dışında",
};

const APP_VERSION = "1.0.0";

export function ProfileScreen() {
  const { user, token, logout } = useAuth();
  const navigation = useNavigation<any>();
  const [editing, setEditing] = useState(false);
  const [bio, setBio] = useState("");
  const [saving, setSaving] = useState(false);
  const [userType, setUserType] = useState<string>("");
  const [privacyVisible, setPrivacyVisible] = useState(false);
  const [stats, setStats] = useState({
    topicCount: 0,
    commentCount: 0,
    followingCount: 0,
    completedSteps: 0,
  });

  useEffect(() => {
    if (!token) return;
    Promise.all([
      api.users.me(token).then((u) => {
        setBio(u.bio || "");
        setUserType(u.userType || "");
      }).catch(() => {}),
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

  const handleMenuPress = (item: string) => {
    switch (item) {
      case "privacy":
        setPrivacyVisible(true);
        break;
      case "help":
        Linking.openURL("mailto:destek@goworldy.com").catch(() =>
          Alert.alert("Hata", "Mail uygulaması açılamadı.")
        );
        break;
      case "about":
        Alert.alert(
          "GoWorldy Hakkında",
          `Sürüm: ${APP_VERSION}\n\nGoWorldy, göç sürecinizi kolaylaştırmak için tasarlanmış güvenilir rehberinizdir.`,
          [{ text: "Tamam" }]
        );
        break;
    }
  };

  const initials = user?.displayName
    ?.split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const typeLabel = userType ? (USER_TYPE_LABELS[userType] ?? "Üye") : "Üye";

  return (
    <>
      <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profil</Text>
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
              <FontAwesome5 name="user-tag" size={11} color={Colors.primary} />
              <Text style={styles.badgeText}>{typeLabel}</Text>
            </View>
            {user?.role === "admin" && (
              <View style={[styles.badge, styles.badgeAdmin]}>
                <Ionicons name="shield-checkmark" size={12} color={Colors.secondary} />
                <Text style={[styles.badgeText, styles.badgeTextAdmin]}>Admin</Text>
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
              <TouchableOpacity onPress={() => setEditing(true)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="pencil" size={18} color={Colors.primary} />
              </TouchableOpacity>
            )}
          </View>
          {editing ? (
            <>
              <TextInput
                style={styles.bioInput}
                placeholder="Kendinden bahset..."
                placeholderTextColor={Colors.textMuted}
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
              color={Colors.primary}
              value={stats.topicCount.toString()}
              label="Konu"
            />
            <StatItem
              icon="chatbubble-ellipses"
              color={Colors.secondary}
              value={stats.commentCount.toString()}
              label="Yorum"
            />
            <StatItem
              icon="checkmark-done"
              color={Colors.warning}
              value={stats.completedSteps.toString()}
              label="Adım"
            />
          </View>
        </View>

        {/* Menu */}
        <View style={styles.menuList}>
          <MenuRow
            icon={<MaterialCommunityIcons name="bell-outline" size={22} color={Colors.neutral} />}
            label="Bildirim Ayarları"
            onPress={() => navigation.navigate("Home", { screen: "Notifications" })}
          />
          <MenuRow
            icon={<MaterialCommunityIcons name="shield-lock-outline" size={22} color={Colors.neutral} />}
            label="Gizlilik"
            onPress={() => handleMenuPress("privacy")}
          />
          <MenuRow
            icon={<Ionicons name="help-circle-outline" size={22} color={Colors.neutral} />}
            label="Yardım & Destek"
            onPress={() => handleMenuPress("help")}
          />
          <MenuRow
            icon={<Ionicons name="information-circle-outline" size={22} color={Colors.neutral} />}
            label="Hakkında"
            onPress={() => handleMenuPress("about")}
            isLast
          />
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <Ionicons name="log-out-outline" size={20} color={Colors.danger} />
          <Text style={styles.logoutText}>Çıkış Yap</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Privacy Modal — full-screen slide-up */}
      <Modal
        visible={privacyVisible}
        animationType="slide"
        onRequestClose={() => setPrivacyVisible(false)}
      >
        <PrivacyScreen onBack={() => setPrivacyVisible(false)} />
      </Modal>
    </>
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

function MenuRow({
  icon,
  label,
  onPress,
  isLast,
}: {
  icon: React.ReactNode;
  label: string;
  onPress?: () => void;
  isLast?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[styles.menuRow, isLast && styles.menuRowLast]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {icon}
      <Text style={styles.menuLabel}>{label}</Text>
      <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: {
    padding: Spacing.md,
    paddingTop: 56,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 20,
  },
  headerTitle: {
    ...Typography.h1,
    color: Colors.textPrimary,
  },
  profileCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    alignItems: "center",
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  avatarBox: {
    position: "relative",
    marginBottom: 12,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: Radius.full,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    color: "#fff",
    fontSize: 32,
    fontWeight: "bold",
  },
  avatarEdit: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: Radius.full,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: Colors.surface,
  },
  displayName: {
    ...Typography.h2,
    color: Colors.textPrimary,
  },
  badgeRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginTop: 6,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
    gap: 4,
  },
  badgeAdmin: {
    backgroundColor: Colors.secondaryLight,
  },
  badgeText: {
    ...Typography.small,
    color: Colors.primary,
    fontWeight: "600",
  },
  badgeTextAdmin: {
    color: Colors.secondary,
  },
  email: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  section: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  sectionTitle: {
    ...Typography.body,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  bioText: {
    ...Typography.label,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  bioInput: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.borderStrong,
    borderRadius: Radius.md,
    padding: 12,
    fontSize: 14,
    color: Colors.textPrimary,
    minHeight: 80,
    textAlignVertical: "top",
  },
  editActions: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginTop: 10,
    justifyContent: "flex-end",
  },
  cancelBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    minHeight: MinTapTarget,
    justifyContent: "center",
  },
  cancelBtnText: {
    color: Colors.textSecondary,
    fontWeight: "500",
  },
  saveBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 18,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.sm,
    minHeight: MinTapTarget,
    justifyContent: "center",
  },
  saveBtnText: {
    color: "#fff",
    fontWeight: "600",
  },
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 6,
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: Colors.textPrimary,
    marginTop: 6,
  },
  statLabel: {
    ...Typography.small,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  menuList: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: "hidden",
  },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    gap: 12,
    minHeight: MinTapTarget,
  },
  menuRowLast: {
    borderBottomWidth: 0,
  },
  menuLabel: {
    flex: 1,
    fontSize: 15,
    color: Colors.textPrimary,
  },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.surface,
    paddingVertical: 14,
    borderRadius: Radius.md,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.dangerLight,
    minHeight: MinTapTarget,
  },
  logoutText: {
    color: Colors.danger,
    fontSize: 15,
    fontWeight: "600",
  },
});
