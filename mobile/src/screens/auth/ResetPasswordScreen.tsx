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
  ScrollView,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { api } from "../../services/api";
import { Colors, Typography, Spacing, Radius, MinTapTarget } from "../../theme";

type Props = {
  onNavigateLogin: () => void;
};

export function ResetPasswordScreen({ onNavigateLogin }: Props) {
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const handleReset = async () => {
    if (!token || !password || !confirm) {
      setError("Tüm alanlar zorunludur.");
      return;
    }
    if (password.length < 6) {
      setError("Şifre en az 6 karakter olmalı.");
      return;
    }
    if (password !== confirm) {
      setError("Şifreler eşleşmiyor.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await api.auth.resetPassword(token.trim(), password);
      setDone(true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Sıfırlama başarısız.");
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <View style={styles.successContainer}>
        <View style={styles.successIcon}>
          <Ionicons name="checkmark-circle" size={64} color={Colors.secondary} />
        </View>
        <Text style={styles.successTitle}>Şifre Güncellendi</Text>
        <Text style={styles.successText}>
          Yeni şifrenle giriş yapabilirsin.
        </Text>
        <TouchableOpacity style={styles.btn} onPress={onNavigateLogin}>
          <Text style={styles.btnText}>Giriş Ekranına Dön</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.logoBox}>
          <MaterialCommunityIcons name="earth" size={56} color={Colors.primary} />
          <Text style={styles.logo}>GoWorldy</Text>
        </View>
        <Text style={styles.title}>Yeni Şifre Belirle</Text>
        <Text style={styles.subtitle}>
          E-postana gönderilen sıfırlama kodunu ve yeni şifreni gir.
        </Text>

        {error && (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={18} color={Colors.danger} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <Text style={styles.label}>Sıfırlama Kodu</Text>
        <View style={styles.inputRow}>
          <Ionicons name="key-outline" size={20} color={Colors.neutral} />
          <TextInput
            style={styles.input}
            placeholder="E-posta ile gelen kod"
            placeholderTextColor={Colors.textMuted}
            value={token}
            onChangeText={setToken}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        <Text style={styles.label}>Yeni Şifre</Text>
        <View style={styles.inputRow}>
          <Ionicons name="lock-closed-outline" size={20} color={Colors.neutral} />
          <TextInput
            style={styles.input}
            placeholder="En az 6 karakter"
            placeholderTextColor={Colors.textMuted}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
          />
          <TouchableOpacity
            onPress={() => setShowPassword((v) => !v)}
            style={styles.showBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons
              name={showPassword ? "eye-off-outline" : "eye-outline"}
              size={22}
              color={Colors.neutral}
            />
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>Şifre Tekrar</Text>
        <View style={styles.inputRow}>
          <Ionicons name="lock-closed-outline" size={20} color={Colors.neutral} />
          <TextInput
            style={styles.input}
            placeholder="Şifreyi tekrar gir"
            placeholderTextColor={Colors.textMuted}
            value={confirm}
            onChangeText={setConfirm}
            secureTextEntry={!showPassword}
          />
        </View>

        <TouchableOpacity
          style={[styles.btn, loading && styles.btnDisabled]}
          onPress={handleReset}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.btnText}>Şifreyi Sıfırla</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={onNavigateLogin} style={styles.link}>
          <Text style={styles.linkText}>Giriş ekranına dön</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Spacing.lg, paddingTop: 60 },
  logoBox: { alignItems: "center", marginBottom: Spacing.md },
  logo: { fontSize: 28, fontWeight: "bold", color: Colors.primary, marginTop: 4 },
  title: { ...Typography.h1, color: Colors.textPrimary, marginBottom: Spacing.sm },
  subtitle: {
    ...Typography.label,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
    lineHeight: 20,
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
  label: {
    ...Typography.caption,
    fontWeight: "500",
    color: Colors.textPrimary,
    marginBottom: 6,
    marginTop: 4,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.borderStrong,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    marginBottom: 14,
    gap: Spacing.sm,
    minHeight: MinTapTarget,
  },
  input: { flex: 1, paddingVertical: 14, fontSize: 16, color: Colors.textPrimary },
  showBtn: {
    minWidth: MinTapTarget,
    minHeight: MinTapTarget,
    justifyContent: "center",
    alignItems: "center",
  },
  btn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: Spacing.md,
    minHeight: MinTapTarget,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  link: { alignItems: "center", paddingVertical: Spacing.md, marginTop: Spacing.xs },
  linkText: { ...Typography.label, color: Colors.primary },
  successContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
  },
  successIcon: { marginBottom: Spacing.md },
  successTitle: { ...Typography.h1, color: Colors.textPrimary, marginBottom: Spacing.sm },
  successText: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: "center",
    marginBottom: Spacing.xl,
  },
});
