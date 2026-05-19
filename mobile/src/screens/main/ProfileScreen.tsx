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

const CHIP_ICONS: Record<string, React.ComponentProps<typeof Ionicons>["name"]> = {
  emigrant: "location-outline",
  consultant: "briefcase-outline",
  diaspora: "earth-outline",
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
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [sharePhone, setSharePhone] = useState<boolean>(false);
  const [aboutVisible, setAboutVisible] = useState(false);
  const [avatarPickerLoading, setAvatarPickerLoading] = useState(false);
  const [userTypeSaving, setUserTypeSaving] = useState(false);
  const [userTypeError, setUserTypeError] = useState<string | null>(null);
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
        setPhoneNumber(u.phoneNumber || "");
        setSharePhone(u.sharePhoneNumber === true);
      }).catch(() => {}),
      api.users.myStats(token).then(setStats).catch(() => {}),
    ]);
  }, [token]);

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
        quality: 0.4,
        allowsEditing: true,
        aspect: [1, 1],
        exif: false,
      });
      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const dataUrl = asset.base64
          ? `data:image/jpeg;base64,${asset.base64}`
          : asset.uri;
        await api.users.updateMe({ avatarUrl: dataUrl }, token);
        setAvatarUrl(dataUrl);
      }
    } catch (e: unknown) {
      Alert.alert("Hata", e instanceof Error ? e.message : "Fotoğraf seçilemedi.");
    } finally {
      setAvatarPickerLoading(false);
    }
  };

  const handleSelectUserType = async (type: "emigrant" | "consultant" | "diaspora") => {
    if (!token || type === userType) return;
    setUserTypeError(null);
    setUserTypeSaving(true);
    const prev = userType;
    setUserType(type);
    try {
      await api.users.updateMe({ userType: type }, token);
    } catch (e: unknown) {
      setUserType(prev);
      setUserTypeError(e instanceof Error ? e.message : "Kaydedilemedi.");
    } finally {
      setUserTypeSaving(false);
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
        setAboutVisible(true);
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
            onPress={handlePickFromGallery}
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
          {sharePhone && !!phoneNumber && (
            <View style={styles.phoneRow}>
              <Ionicons name="call-outline" size={14} color={Colors.textSecondary} />
              <Text style={styles.phoneText}>{phoneNumber}</Text>
            </View>
          )}
        </View>

        {/* Üye Türü Seçici */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Üye Türü</Text>
          </View>
          <View style={styles.chipRow}>
            {(["emigrant", "consultant", "diaspora"] as const).map((type) => {
              const active = userType === type;
              const isSavingThis = userTypeSaving && active;
              return (
                <TouchableOpacity
                  key={type}
                  style={[styles.chip, active && styles.chipActive]}
                  onPress={() => handleSelectUserType(type)}
                  activeOpacity={0.7}
                  disabled={userTypeSaving}
                >
                  {isSavingThis ? (
                    <ActivityIndicator size="small" color={Colors.surface} />
                  ) : (
                    <Ionicons
                      name={CHIP_ICONS[type]}
                      size={14}
                      color={active ? Colors.surface : Colors.textSecondary}
                    />
                  )}
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>
                    {USER_TYPE_LABELS[type]}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          {userTypeError && (
            <Text style={styles.inlineError}>{userTypeError}</Text>
          )}
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
              onPress={() => navigation.navigate("MyTopics")}
            />
            <StatItem
              icon="chatbubble-ellipses"
              color={Colors.secondary}
              value={stats.commentCount.toString()}
              label="Yorum"
              onPress={() => navigation.navigate("MyComments")}
            />
            <StatItem
              icon="checkmark-done"
              color={Colors.warning}
              value={stats.completedSteps.toString()}
              label="Adım"
              onPress={() => navigation.getParent()?.navigate("Guide")}
            />
          </View>
        </View>

        {/* Menu */}
        <View style={styles.menuList}>
          <MenuRow
            icon={<Ionicons name="bookmark-outline" size={22} color={Colors.neutral} />}
            label="Favorilerim"
            onPress={() => navigation.navigate("Favorites")}
          />
          <MenuRow
            icon={<MaterialCommunityIcons name="bell-outline" size={22} color={Colors.neutral} />}
            label="Bildirim Ayarları"
            onPress={() => navigation.getParent()?.navigate("Home", { screen: "Notifications" })}
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

      {/* About Modal */}
      <Modal
        visible={aboutVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setAboutVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>GoWorldy Hakkında</Text>
            <Text style={styles.modalSubtitle}>
              {`Sürüm: ${APP_VERSION}\n\nGoWorldy, göç sürecinizi kolaylaştırmak için tasarlanmış güvenilir rehberinizdir.`}
            </Text>
            <TouchableOpacity style={styles.modalSave} onPress={() => setAboutVisible(false)}>
              <Text style={styles.modalSaveText}>Tamam</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Privacy Modal — full-screen slide-up */}
      <Modal
        visible={privacyVisible}
        animationType="slide"
        onRequestClose={() => setPrivacyVisible(false)}
      >
        <PrivacyScreen
          onBack={() => setPrivacyVisible(false)}
          onPhoneSettingsChange={(phone, share) => {
            setPhoneNumber(phone);
            setSharePhone(share);
          }}
        />
      </Modal>
    </>
  );
}

function StatItem({
  icon,
  color,
  value,
  label,
  onPress,
}: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  color: string;
  value: string;
  label: string;
  onPress?: () => void;
}) {
  return (
    <TouchableOpacity style={styles.statItem} onPress={onPress} activeOpacity={0.75}>
      <Ionicons name={icon} size={22} color={color} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </TouchableOpacity>
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
    marginBottom: Spacing.lg,
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
  phoneRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  phoneText: {
    ...Typography.caption,
    color: Colors.textSecondary,
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
    marginBottom: Spacing.sm,
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
    marginTop: Spacing.sm,
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
  chipRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    flexWrap: "wrap",
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    borderColor: Colors.borderStrong,
    backgroundColor: Colors.background,
  },
  chipActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary,
  },
  chipText: {
    ...Typography.label,
    color: Colors.textSecondary,
  },
  chipTextActive: {
    color: Colors.surface,
    fontWeight: "600",
  },
  inlineError: {
    ...Typography.small,
    color: Colors.danger,
    marginTop: Spacing.sm,
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
  modalSave: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 18,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.sm,
    minHeight: MinTapTarget,
    justifyContent: "center",
  },
  modalSaveText: {
    color: Colors.surface,
    fontWeight: "600",
  },
});
