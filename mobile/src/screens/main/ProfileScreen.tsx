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
  Image,
  ActivityIndicator,
} from "react-native";
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
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
  const [savedBio, setSavedBio] = useState("");
  const [saving, setSaving] = useState(false);
  const [userType, setUserType] = useState<string>("");
  const [avatarUrl, setAvatarUrl] = useState<string>("");
  const [avatarModalVisible, setAvatarModalVisible] = useState(false);
  const [avatarModalView, setAvatarModalView] = useState<"options" | "url">("options");
  const [avatarInput, setAvatarInput] = useState("");
  const [avatarPickerLoading, setAvatarPickerLoading] = useState(false);
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
        setSavedBio(u.bio || "");
        setUserType(u.userType || "");
        setAvatarUrl(u.avatarUrl || "");
      }).catch(() => {}),
      api.users.myStats(token).then(setStats).catch(() => {}),
    ]);
  }, [token]);

  const closeAvatarModal = () => {
    setAvatarModalVisible(false);
    setAvatarModalView("options");
    setAvatarInput("");
  };

  const handlePickFromGallery = async () => {
    if (!token) return;
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("İzin Gerekli", "Galeriye erişim için izin vermeniz gerekiyor.");
      return;
    }
    setAvatarPickerLoading(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: "images",
        base64: true,
        quality: 0.7,
        allowsEditing: true,
        aspect: [1, 1],
      });
      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const dataUrl = asset.base64
          ? `data:image/jpeg;base64,${asset.base64}`
          : asset.uri;
        await api.users.updateMe({ avatarUrl: dataUrl }, token);
        setAvatarUrl(dataUrl);
        closeAvatarModal();
      }
    } catch (e: unknown) {
      Alert.alert("Hata", e instanceof Error ? e.message : "Fotoğraf seçilemedi.");
    } finally {
      setAvatarPickerLoading(false);
    }
  };

  const handleSaveAvatar = async () => {
    if (!token) return;
    const url = avatarInput.trim();
    if (!url) {
      setAvatarUrl("");
      closeAvatarModal();
      await api.users.updateMe({ avatarUrl: "" }, token).catch(() => {});
      return;
    }
    try {
      await api.users.updateMe({ avatarUrl: url }, token);
      setAvatarUrl(url);
      closeAvatarModal();
    } catch (e: unknown) {
      Alert.alert("Hata", e instanceof Error ? e.message : "Kaydedilemedi.");
    }
  };

  const handleSaveBio = async () => {
    if (!token) return;
    setSaving(true);
    try {
      await api.users.updateMe({ bio }, token);
      setSavedBio(bio);
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
          <TouchableOpacity
            style={styles.avatarBox}
            activeOpacity={0.8}
            onPress={() => {
              setAvatarInput(avatarUrl);
              setAvatarModalVisible(true);
            }}
          >
            <View style={styles.avatar}>
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
              ) : (
                <Text style={styles.avatarText}>{initials || "?"}</Text>
              )}
            </View>
            <View style={styles.avatarOverlay}>
              <Ionicons name="camera" size={18} color={Colors.surface} />
            </View>
          </TouchableOpacity>
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
                    setBio(savedBio);
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

      {/* Avatar Modal */}
      <Modal
        visible={avatarModalVisible}
        transparent
        animationType="fade"
        onRequestClose={closeAvatarModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Profil Fotoğrafı</Text>

            {avatarModalView === "options" ? (
              <>
                <Text style={styles.modalSubtitle}>
                  Fotoğrafınızı nasıl güncellemek istersiniz?
                </Text>

                <TouchableOpacity
                  style={styles.avatarOptionBtn}
                  onPress={handlePickFromGallery}
                  activeOpacity={0.8}
                  disabled={avatarPickerLoading}
                >
                  {avatarPickerLoading ? (
                    <ActivityIndicator size="small" color={Colors.surface} />
                  ) : (
                    <Ionicons name="images-outline" size={20} color={Colors.surface} />
                  )}
                  <Text style={styles.avatarOptionBtnText}>Galeriden Seç</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.avatarOptionSecondaryBtn}
                  onPress={() => setAvatarModalView("url")}
                  activeOpacity={0.8}
                >
                  <Ionicons name="link-outline" size={20} color={Colors.primary} />
                  <Text style={styles.avatarOptionSecondaryBtnText}>URL Gir</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.modalCancel} onPress={closeAvatarModal}>
                  <Text style={styles.modalCancelText}>İptal</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={styles.modalSubtitle}>
                  Fotoğrafınızın doğrudan bağlantısını girin (https://...)
                </Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="https://..."
                  placeholderTextColor={Colors.textMuted}
                  value={avatarInput}
                  onChangeText={setAvatarInput}
                  autoCapitalize="none"
                  keyboardType="url"
                />
                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={styles.modalCancel}
                    onPress={() => setAvatarModalView("options")}
                  >
                    <Text style={styles.modalCancelText}>Geri</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.modalSave} onPress={handleSaveAvatar}>
                    <Text style={styles.modalSaveText}>Kaydet</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

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
    width: 88,
    height: 88,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: Radius.full,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  avatarText: {
    color: Colors.surface,
    fontSize: 32,
    fontWeight: "bold",
  },
  avatarImage: {
    width: 88,
    height: 88,
    borderRadius: Radius.full,
  },
  avatarOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 30,
    borderBottomLeftRadius: Radius.full,
    borderBottomRightRadius: Radius.full,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
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
    color: Colors.surface,
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
    borderBottomColor: Colors.border,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    paddingHorizontal: Spacing.lg,
  },
  modalCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "600" as const,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  modalSubtitle: {
    ...Typography.small,
    color: Colors.textSecondary,
    marginBottom: 16,
  },
  modalInput: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.borderStrong,
    borderRadius: Radius.md,
    padding: 12,
    fontSize: 14,
    color: Colors.textPrimary,
    marginBottom: 16,
  },
  modalActions: {
    flexDirection: "row",
    gap: Spacing.sm,
    justifyContent: "flex-end",
  },
  modalCancel: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    minHeight: MinTapTarget,
    justifyContent: "center",
  },
  modalCancelText: {
    color: Colors.textSecondary,
    fontWeight: "500",
  },
  modalSave: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 18,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.sm,
    minHeight: MinTapTarget,
    justifyContent: "center",
  },
  avatarOptionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    paddingVertical: 14,
    gap: 8,
    marginBottom: Spacing.sm,
  },
  avatarOptionBtnText: {
    color: Colors.surface,
    fontWeight: "600",
    fontSize: 15,
  },
  avatarOptionSecondaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: Radius.md,
    paddingVertical: 14,
    gap: 8,
    marginBottom: Spacing.md,
  },
  avatarOptionSecondaryBtnText: {
    color: Colors.primary,
    fontWeight: "600",
    fontSize: 15,
  },
  modalSaveText: {
    color: Colors.surface,
    fontWeight: "600",
  },
});
