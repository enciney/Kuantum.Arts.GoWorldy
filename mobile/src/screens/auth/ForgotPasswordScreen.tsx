import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { api } from "../../services/api";
import { Colors, Typography, Spacing, Radius, MinTapTarget } from "../../theme";

type Props = {
  onNavigateLogin: () => void;
  onNavigateReset: () => void;
};

export function ForgotPasswordScreen({ onNavigateLogin, onNavigateReset }: Props) {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isValidEmail = (value: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

  const handleSubmit = async () => {
    if (!email) {
      setError("E-posta adresi zorunludur.");
      return;
    }
    if (!isValidEmail(email)) {
      setError("Geçerli bir e-posta adresi girin.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await api.auth.forgotPassword(email.trim());
      setSubmitted(true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "İstek başarısız.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.inner}>
        <View style={styles.logoBox}>
          <MaterialCommunityIcons name="earth" size={56} color={Colors.primary} />
          <Text style={styles.logo}>GoWorldy</Text>
        </View>
        <Text style={styles.title}>Şifremi Unuttum</Text>
        <Text style={styles.subtitle}>
          E-posta adresinizi girin, şifre sıfırlama bağlantısı gönderelim.
        </Text>

        {submitted ? (
          <>
            <View style={styles.successBox}>
              <Ionicons name="checkmark-circle" size={20} color={Colors.secondary} />
              <Text style={styles.successText}>
                Şifre sıfırlama kodu e-posta ile gönderildi.
              </Text>
            </View>
            <TouchableOpacity style={styles.btn} onPress={onNavigateReset}>
              <Text style={styles.btnText}>Kodum var, şifreyi sıfırla</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            {error && (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={18} color={Colors.danger} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}
            <TextInput
              style={styles.input}
              placeholder="E-posta adresiniz"
              placeholderTextColor={Colors.textMuted}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity
              style={[styles.btn, loading && styles.btnDisabled]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.btnText}>Sıfırlama Linki Gönder</Text>
              )}
            </TouchableOpacity>
          </>
        )}

        <TouchableOpacity onPress={onNavigateLogin} style={styles.link}>
          <Text style={styles.linkText}>Giriş ekranına dön</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  inner: { flex: 1, paddingHorizontal: Spacing.lg, paddingTop: 60 },
  logoBox: { alignItems: "center", marginBottom: Spacing.md },
  logo: { fontSize: 28, fontWeight: "bold", color: Colors.primary, marginTop: 4 },
  title: { ...Typography.h1, color: Colors.textPrimary, marginBottom: Spacing.sm },
  subtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    marginBottom: Spacing.xl,
    lineHeight: 22,
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.dangerLight,
    borderRadius: Radius.md,
    padding: 10,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  errorText: { ...Typography.caption, color: Colors.danger, flex: 1 },
  input: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.borderStrong,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 14,
    fontSize: 16,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
    minHeight: MinTapTarget,
  },
  btn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: Spacing.md,
    minHeight: MinTapTarget,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  successBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: Colors.secondaryLight,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  successText: { fontSize: 15, color: "#065F46", lineHeight: 22, flex: 1 },
  link: { alignItems: "center", paddingVertical: Spacing.sm },
  linkText: { ...Typography.label, color: Colors.primary },
});
