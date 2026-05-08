import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useAuth } from "../../context/AuthContext";
import { useGoogleAuth, isGoogleSignInConfigured } from "../../services/google-signin";

type Props = {
  onNavigateRegister: () => void;
  onNavigateForgot: () => void;
};

export function LoginScreen({ onNavigateRegister, onNavigateForgot }: Props) {
  const { login, loginWithGoogle } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { request, response, promptAsync } = useGoogleAuth();

  useEffect(() => {
    if (response?.type === "success" && response.params.id_token) {
      const idToken = response.params.id_token;
      setGoogleLoading(true);
      loginWithGoogle(idToken)
        .catch((e: unknown) =>
          Alert.alert(
            "Google ile giriş başarısız",
            e instanceof Error ? e.message : "Bilinmeyen hata"
          )
        )
        .finally(() => setGoogleLoading(false));
    } else if (response?.type === "error") {
      Alert.alert("Google girişi iptal edildi", response.error?.message || "");
    }
  }, [response, loginWithGoogle]);

  const handleLogin = async () => {
    if (!email || !password) {
      setError("E-posta ve şifre zorunludur.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await login(email.trim(), password);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Giriş başarısız.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    if (!isGoogleSignInConfigured()) {
      Alert.alert(
        "Google Sign-In yapılandırılmamış",
        "EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID environment değişkeni mobile/.env dosyasına eklenmeli."
      );
      return;
    }
    promptAsync();
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.inner}>
        <View style={styles.logoBox}>
          <MaterialCommunityIcons name="earth" size={56} color="#2563EB" />
          <Text style={styles.logo}>GoWorldy</Text>
        </View>
        <Text style={styles.subtitle}>Göç rehberinize giriş yapın</Text>

        {error && (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={18} color="#EF4444" />
            <Text style={styles.error}>{error}</Text>
          </View>
        )}

        <View style={styles.inputRow}>
          <Ionicons name="mail-outline" size={20} color="#6B7280" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="E-posta"
            placeholderTextColor="#9CA3AF"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        <View style={styles.inputRow}>
          <Ionicons name="lock-closed-outline" size={20} color="#6B7280" style={styles.inputIcon} />
          <TextInput
            style={[styles.input, styles.passwordInput]}
            placeholder="Şifre"
            placeholderTextColor="#9CA3AF"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
          />
          <TouchableOpacity
            style={styles.showBtn}
            onPress={() => setShowPassword((v) => !v)}
          >
            <Ionicons
              name={showPassword ? "eye-off-outline" : "eye-outline"}
              size={22}
              color="#6B7280"
            />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.btn, loading && styles.btnDisabled]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.btnText}>Giriş Yap</Text>
          )}
        </TouchableOpacity>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>veya</Text>
          <View style={styles.dividerLine} />
        </View>

        <TouchableOpacity
          style={[styles.googleBtn, (!request || googleLoading) && { opacity: 0.6 }]}
          onPress={handleGoogleLogin}
          disabled={!request || googleLoading}
        >
          {googleLoading ? (
            <ActivityIndicator color="#EA4335" size="small" />
          ) : (
            <Ionicons name="logo-google" size={20} color="#EA4335" />
          )}
          <Text style={styles.googleBtnText}>Google ile Giriş Yap</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={onNavigateForgot} style={styles.link}>
          <Text style={styles.linkText}>Şifremi Unuttum</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={onNavigateRegister} style={styles.link}>
          <Text style={styles.linkText}>
            Hesabın yok mu? <Text style={styles.linkBold}>Kayıt Ol</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  inner: { flex: 1, paddingHorizontal: 24, paddingTop: 60, alignItems: "stretch" },
  logoBox: { alignItems: "center", marginBottom: 8 },
  logo: { fontSize: 28, fontWeight: "bold", color: "#2563EB", marginTop: 4 },
  subtitle: { fontSize: 15, color: "#6B7280", textAlign: "center", marginBottom: 28 },
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
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 12,
    marginBottom: 12,
    paddingHorizontal: 12,
  },
  inputIcon: { marginRight: 8 },
  input: { flex: 1, paddingVertical: 14, fontSize: 16, color: "#111827" },
  passwordInput: { paddingRight: 40 },
  showBtn: { padding: 6 },
  btn: {
    backgroundColor: "#2563EB",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 4,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  divider: { flexDirection: "row", alignItems: "center", marginVertical: 20 },
  dividerLine: { flex: 1, height: 1, backgroundColor: "#E5E7EB" },
  dividerText: { marginHorizontal: 12, color: "#9CA3AF", fontSize: 13 },
  googleBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 12,
    paddingVertical: 14,
    gap: 10,
  },
  googleBtnText: { fontSize: 15, color: "#111827", fontWeight: "500" },
  link: { alignItems: "center", paddingVertical: 10, marginTop: 4 },
  linkText: { color: "#6B7280", fontSize: 14 },
  linkBold: { color: "#2563EB", fontWeight: "600" },
});
