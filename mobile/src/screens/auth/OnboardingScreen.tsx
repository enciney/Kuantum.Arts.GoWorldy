import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../services/api";
import { Colors, Spacing, Radius } from "../../theme";

type UserType = "emigrant" | "consultant" | "diaspora";

const USER_TYPE_OPTIONS: {
  value: UserType;
  label: string;
  desc: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
}[] = [
  {
    value: "emigrant",
    label: "Göç Etmek İstiyorum",
    desc: "Yurt dışına taşınmayı planlıyorum",
    icon: "airplane-outline",
  },
  {
    value: "diaspora",
    label: "Yurt Dışındayım",
    desc: "Halihazırda yurt dışında yaşıyorum",
    icon: "earth-outline",
  },
  {
    value: "consultant",
    label: "Danışmanım",
    desc: "Göç süreçlerinde rehberlik ediyorum",
    icon: "briefcase-outline",
  },
];

export function OnboardingScreen() {
  const { user, token, completeOnboarding } = useAuth();
  const [userType, setUserType] = useState<UserType>("emigrant");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleContinue = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      await api.users.updateMe(
        {
          userType,
          phoneNumber: phone.trim() || undefined,
        },
        token
      );
      completeOnboarding();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Bir hata oluştu, tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.inner}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.wave}>👋</Text>
          <Text style={styles.title}>
            Hoş geldin{user?.displayName ? `, ${user.displayName.split(" ")[0]}` : ""}!
          </Text>
          <Text style={styles.subtitle}>
            Sana daha iyi yardımcı olabilmemiz için birkaç bilgiye ihtiyacımız var.
          </Text>
        </View>

        {/* User type */}
        <Text style={styles.sectionLabel}>Senin için en uygun seçenek hangisi?</Text>
        <View style={styles.options}>
          {USER_TYPE_OPTIONS.map((opt) => {
            const active = userType === opt.value;
            return (
              <TouchableOpacity
                key={opt.value}
                style={[styles.optionCard, active && styles.optionCardActive]}
                onPress={() => setUserType(opt.value)}
                activeOpacity={0.7}
              >
                <View style={[styles.optionIcon, active && styles.optionIconActive]}>
                  <Ionicons
                    name={opt.icon}
                    size={24}
                    color={active ? "#fff" : Colors.primary}
                  />
                </View>
                <View style={styles.optionText}>
                  <Text style={[styles.optionLabel, active && styles.optionLabelActive]}>
                    {opt.label}
                  </Text>
                  <Text style={styles.optionDesc}>{opt.desc}</Text>
                </View>
                {active && (
                  <Ionicons name="checkmark-circle" size={20} color={Colors.primary} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Phone */}
        <Text style={styles.sectionLabel}>Telefon numarası <Text style={styles.optional}>(isteğe bağlı)</Text></Text>
        <View style={styles.inputRow}>
          <Ionicons name="call-outline" size={20} color={Colors.neutral} style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="+90 555 000 00 00"
            placeholderTextColor={Colors.textMuted}
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />
        </View>

        {error && (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={16} color={Colors.danger} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Continue */}
        <TouchableOpacity
          style={[styles.btn, loading && styles.btnDisabled]}
          onPress={handleContinue}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={styles.btnText}>Devam Et</Text>
              <Ionicons name="arrow-forward" size={18} color="#fff" />
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={completeOnboarding} style={styles.skipBtn} activeOpacity={0.6}>
          <Text style={styles.skipText}>Şimdi değil, atla</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  inner: {
    flexGrow: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: 64,
    paddingBottom: 40,
  },

  // Header
  header: { alignItems: "center", marginBottom: 32 },
  wave: { fontSize: 40, marginBottom: 12 },
  title: { fontSize: 26, fontWeight: "700", color: Colors.textPrimary, textAlign: "center" },
  subtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: "center",
    marginTop: 8,
    lineHeight: 22,
  },

  // Section label
  sectionLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  optional: { fontSize: 13, fontWeight: "400", color: Colors.textMuted },

  // Options
  options: { gap: 10, marginBottom: 28 },
  optionCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 2,
    borderColor: Colors.border,
    padding: 14,
    gap: 12,
  },
  optionCardActive: {
    borderColor: Colors.primary,
    backgroundColor: "#EFF6FF",
  },
  optionIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#DBEAFE",
    alignItems: "center",
    justifyContent: "center",
  },
  optionIconActive: { backgroundColor: Colors.primary },
  optionText: { flex: 1 },
  optionLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  optionLabelActive: { color: Colors.primary },
  optionDesc: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },

  // Phone input
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.borderStrong,
    borderRadius: Radius.md,
    paddingHorizontal: 12,
    marginBottom: 24,
    minHeight: 52,
  },
  inputIcon: { marginRight: Spacing.sm },
  input: { flex: 1, fontSize: 16, color: Colors.textPrimary, paddingVertical: 14 },

  // Error
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.dangerLight,
    borderRadius: Radius.sm,
    padding: 10,
    marginBottom: 16,
  },
  errorText: { fontSize: 13, color: Colors.danger, flex: 1 },

  // Buttons
  btn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  skipBtn: { alignItems: "center", paddingVertical: 14 },
  skipText: { fontSize: 14, color: Colors.textMuted },
});
