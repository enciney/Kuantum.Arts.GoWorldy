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
import { Ionicons } from "@expo/vector-icons";
import { api } from "../../services/api";

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
          <Ionicons name="checkmark-circle" size={64} color="#10B981" />
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
        <Text style={styles.title}>Yeni Şifre Belirle</Text>
        <Text style={styles.subtitle}>
          E-postana gönderilen sıfırlama kodunu ve yeni şifreni gir.
        </Text>

        {error && (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={18} color="#EF4444" />
            <Text style={styles.error}>{error}</Text>
          </View>
        )}

        <Text style={styles.label}>Sıfırlama Kodu</Text>
        <View style={styles.inputRow}>
          <Ionicons name="key-outline" size={20} color="#6B7280" />
          <TextInput
            style={styles.input}
            placeholder="E-posta ile gelen kod"
            placeholderTextColor="#9CA3AF"
            value={token}
            onChangeText={setToken}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        <Text style={styles.label}>Yeni Şifre</Text>
        <View style={styles.inputRow}>
          <Ionicons name="lock-closed-outline" size={20} color="#6B7280" />
          <TextInput
            style={styles.input}
            placeholder="En az 6 karakter"
            placeholderTextColor="#9CA3AF"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
          />
          <TouchableOpacity onPress={() => setShowPassword((v) => !v)}>
            <Ionicons
              name={showPassword ? "eye-off-outline" : "eye-outline"}
              size={22}
              color="#6B7280"
            />
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>Şifre Tekrar</Text>
        <View style={styles.inputRow}>
          <Ionicons name="lock-closed-outline" size={20} color="#6B7280" />
          <TextInput
            style={styles.input}
            placeholder="Şifreyi tekrar gir"
            placeholderTextColor="#9CA3AF"
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
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  scroll: { padding: 24, paddingTop: 80 },
  title: { fontSize: 24, fontWeight: "bold", color: "#111827", marginBottom: 8 },
  subtitle: { fontSize: 14, color: "#6B7280", marginBottom: 24, lineHeight: 20 },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEE2E2",
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
    gap: 8,
  },
  error: { color: "#EF4444", fontSize: 13, flex: 1 },
  label: { fontSize: 13, fontWeight: "500", color: "#374151", marginBottom: 6, marginTop: 4 },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 14,
    gap: 8,
  },
  input: { flex: 1, paddingVertical: 14, fontSize: 16, color: "#111827" },
  btn: {
    backgroundColor: "#2563EB",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 12,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  link: { alignItems: "center", paddingVertical: 12, marginTop: 4 },
  linkText: { color: "#2563EB", fontSize: 14 },
  successContainer: {
    flex: 1,
    backgroundColor: "#F9FAFB",
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  successIcon: { marginBottom: 16 },
  successTitle: { fontSize: 22, fontWeight: "bold", color: "#111827", marginBottom: 8 },
  successText: { fontSize: 15, color: "#6B7280", textAlign: "center", marginBottom: 32 },
});
