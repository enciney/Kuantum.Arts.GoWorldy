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
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Typography, Spacing, Radius, MinTapTarget } from "../../theme";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../services/api";
import { validatePhoneTR } from "../../utils/phone";

interface Props {
  onBack: () => void;
  onPhoneSettingsChange?: (phoneNumber: string, sharePhone: boolean) => void;
}

export function PrivacyScreen({ onBack, onPhoneSettingsChange }: Props) {
  const { token } = useAuth();
  const [sharePhone, setSharePhone] = useState(true);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [phoneSaved, setPhoneSaved] = useState("");
  const [phoneSaving, setPhoneSaving] = useState(false);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [phoneSaveSuccess, setPhoneSaveSuccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!token) return;
    api.users
      .me(token)
      .then((u) => {
        setSharePhone(u.sharePhoneNumber !== false);
        setPhoneNumber(u.phoneNumber || "");
        setPhoneSaved(u.phoneNumber || "");
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  const handleSavePhone = async () => {
    if (!token) return;
    // USR-PRV-002: client-side hızlı validasyon
    const clientError = validatePhoneTR(phoneNumber);
    if (clientError) {
      setPhoneError(clientError);
      return;
    }
    setPhoneError(null);
    setPhoneSaving(true);
    try {
      const updated = await api.users.updateMe({ phoneNumber }, token);
      // Backend normalize edilmiş halini döner — UI'a yansıt
      const normalized = (updated as { phoneNumber?: string }).phoneNumber ?? phoneNumber;
      setPhoneNumber(normalized);
      setPhoneSaved(normalized);
      setPhoneSaveSuccess(true);
      setTimeout(() => setPhoneSaveSuccess(false), 2000);
      onPhoneSettingsChange?.(normalized, sharePhone);
    } catch (e: unknown) {
      setPhoneError(e instanceof Error ? e.message : "Kaydedilemedi.");
    } finally {
      setPhoneSaving(false);
    }
  };

  const handlePhoneToggle = async (value: boolean) => {
    if (!token) return;
    const prev = sharePhone;
    setSharePhone(value);
    setSaving(true);
    try {
      await api.users.updateMe({ sharePhoneNumber: value ? 1 : 0 }, token);
      onPhoneSettingsChange?.(phoneSaved, value);
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

          {/* Telefon Numarası Input */}
          <View style={styles.card}>
            <View style={styles.phoneRow}>
              <View style={styles.settingIconBox}>
                <Ionicons name="call-outline" size={20} color={Colors.primary} />
              </View>
              <View style={styles.phoneInputWrapper}>
                <Text style={styles.settingTitle}>Telefon Numarası</Text>
                <TextInput
                  style={styles.phoneInput}
                  placeholder="+90 5XX XXX XX XX"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="phone-pad"
                  value={phoneNumber}
                  onChangeText={(v) => {
                    setPhoneNumber(v);
                    setPhoneError(null);
                  }}
                  returnKeyType="done"
                  onSubmitEditing={handleSavePhone}
                />
                {phoneError && (
                  <Text style={styles.phoneError}>{phoneError}</Text>
                )}
              </View>
              <TouchableOpacity
                style={[
                  styles.phoneSaveBtn,
                  phoneSaveSuccess && styles.phoneSaveBtnSuccess,
                  (phoneSaving || (!phoneSaveSuccess && phoneNumber === phoneSaved)) && { opacity: 0.4 },
                ]}
                onPress={handleSavePhone}
                disabled={phoneSaving || phoneSaveSuccess || phoneNumber === phoneSaved}
                activeOpacity={0.7}
              >
                {phoneSaving ? (
                  <ActivityIndicator size="small" color={Colors.surface} />
                ) : phoneSaveSuccess ? (
                  <Ionicons name="checkmark" size={16} color={Colors.surface} />
                ) : (
                  <Text style={styles.phoneSaveBtnText}>Kaydet</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>

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
  phoneRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    gap: Spacing.md,
  },
  phoneInputWrapper: {
    flex: 1,
  },
  phoneInput: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.borderStrong,
    borderRadius: Radius.sm,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 14,
    color: Colors.textPrimary,
    marginTop: 4,
  },
  phoneError: {
    ...Typography.small,
    color: Colors.danger,
    marginTop: 4,
  },
  phoneSaveBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.sm,
    minHeight: MinTapTarget,
    justifyContent: "center",
    alignItems: "center",
  },
  phoneSaveBtnSuccess: {
    backgroundColor: Colors.secondary,
  },
  phoneSaveBtnText: {
    color: Colors.surface,
    fontWeight: "600",
    fontSize: 13,
  },
});
