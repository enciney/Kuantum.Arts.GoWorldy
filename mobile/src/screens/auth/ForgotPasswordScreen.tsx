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
import { api } from "../../services/api";

type Props = {
  onNavigateLogin: () => void;
  onNavigateReset: () => void;
};

export function ForgotPasswordScreen({ onNavigateLogin, onNavigateReset }: Props) {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email) {
      setError("E-posta adresi zorunludur.");
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
        <Text style={styles.title}>Şifremi Unuttum</Text>
        <Text style={styles.subtitle}>
          E-posta adresinizi girin, şifre sıfırlama bağlantısı gönderelim.
        </Text>

        {submitted ? (
          <>
            <View style={styles.successBox}>
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
            {error && <Text style={styles.error}>{error}</Text>}
            <TextInput
              style={styles.input}
              placeholder="E-posta adresiniz"
              placeholderTextColor="#9CA3AF"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity
              style={[styles.btn, loading && { opacity: 0.6 }]}
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
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  inner: { flex: 1, paddingHorizontal: 24, paddingTop: 80 },
  title: { fontSize: 24, fontWeight: "bold", color: "#111827", marginBottom: 8 },
  subtitle: { fontSize: 15, color: "#6B7280", marginBottom: 32, lineHeight: 22 },
  error: { color: "#EF4444", fontSize: 14, marginBottom: 12 },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: "#111827",
    marginBottom: 12,
  },
  btn: {
    backgroundColor: "#2563EB",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 16,
  },
  btnText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  successBox: {
    backgroundColor: "#D1FAE5",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  successText: { color: "#065F46", fontSize: 15, lineHeight: 22 },
  link: { alignItems: "center", paddingVertical: 8 },
  linkText: { color: "#2563EB", fontSize: 14 },
});
