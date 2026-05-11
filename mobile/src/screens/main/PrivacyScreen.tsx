import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Typography, Spacing, Radius } from "../../theme";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../services/api";

interface Props {
  onBack: () => void;
}

export function PrivacyScreen({ onBack }: Props) {
  const { token } = useAuth();
  const [sharePhone, setSharePhone] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!token) return;
    api.users
      .me(token)
      .then((u) => {
        setSharePhone(u.sharePhoneNumber !== false);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  const handlePhoneToggle = async (value: boolean) => {
    if (!token) return;
    const prev = sharePhone;
    setSharePhone(value);
    setSaving(true);
    try {
      await api.users.updateMe({ sharePhoneNumber: value ? 1 : 0 }, token);
    } catch {
      setSharePhone(prev);
      Alert.alert("Hata", "Ayar kaydedilemedi. Lütfen tekrar dene.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="chevron-back" size={26} color={Colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Gizlilik</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.primary} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={styles.sectionLabel}>İLETİŞİM BİLGİLERİ</Text>

          <View style={styles.card}>
            <View style={styles.settingRow}>
              <View style={styles.settingIconBox}>
                <Ionicons name="call-outline" size={20} color={Colors.primary} />
              </View>
              <View style={styles.settingText}>
                <Text style={styles.settingTitle}>Telefon Numaramı Paylaş</Text>
                <Text style={styles.settingDesc}>
                  Diğer kullanıcılar telefon numaranı profilinde görebilir.
                </Text>
              </View>
              {saving ? (
                <ActivityIndicator
                  size="small"
                  color={Colors.primary}
                  style={{ marginLeft: Spacing.sm }}
                />
              ) : (
                <Switch
                  value={sharePhone}
                  onValueChange={handlePhoneToggle}
                  trackColor={{
                    false: Colors.border,
                    true: Colors.primaryLight,
                  }}
                  thumbColor={sharePhone ? Colors.primary : Colors.neutral}
                  ios_backgroundColor={Colors.border}
                />
              )}
            </View>
          </View>

          <Text style={styles.sectionNote}>
            Gizlilik ayarlarını istediğin zaman değiştirebilirsin. Değişiklikler
            anında geçerli olur.
          </Text>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.sm,
    paddingTop: 56,
    paddingBottom: Spacing.md,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: {
    padding: Spacing.xs,
    minWidth: 44,
    minHeight: 44,
    justifyContent: "center",
  },
  headerTitle: {
    ...Typography.h2,
    color: Colors.textPrimary,
  },
  headerPlaceholder: {
    width: 44,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  scroll: {
    padding: Spacing.md,
  },
  sectionLabel: {
    ...Typography.small,
    color: Colors.textSecondary,
    fontWeight: "600",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginBottom: Spacing.sm,
    marginLeft: Spacing.xs,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
    overflow: "hidden",
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    gap: Spacing.md,
    minHeight: 44,
  },
  settingIconBox: {
    width: 36,
    height: 36,
    borderRadius: Radius.sm,
    backgroundColor: Colors.primaryLight,
    justifyContent: "center",
    alignItems: "center",
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    ...Typography.label,
    color: Colors.textPrimary,
  },
  settingDesc: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
    lineHeight: 18,
  },
  sectionNote: {
    ...Typography.caption,
    color: Colors.textMuted,
    lineHeight: 18,
    marginTop: Spacing.xs,
    marginHorizontal: Spacing.xs,
  },
});
