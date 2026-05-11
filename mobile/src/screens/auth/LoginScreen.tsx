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
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useAuth } from "../../context/AuthContext";
import { useGoogleAuth, isGoogleSignInConfigured } from "../../services/google-signin";
import { Colors, Typography, Spacing, Radius, MinTapTarget } from "../../theme";

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
          setError(e instanceof Error ? e.message : "Google girişi başarısız.")
        )
        .finally(() => setGoogleLoading(false));
    } else if (response?.type === "error") {
      setError(response.error?.message || "Google girişi iptal edildi.");
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
      setError("EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID environment değişkeni mobile/.env dosyasına eklenmeli.");
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
          <MaterialCommunityIcons name="earth" size={56} color={Colors.primary} />
          <Text style={styles.logo}>GoWorldy</Text>
        </View>
        <Text style={styles.subtitle}>Göç rehberinize giriş yapın</Text>

        {error && (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={18} color={Colors.danger} />
            <Text style={styles.error}>{error}</Text>
          </View>
        )}

        <View style={styles.inputRow}>
          <Ionicons name="mail-outline" size={20} color={Colors.neutral} style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="E-posta"
            placeholderTextColor={Colors.textMuted}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        <View style={styles.inputRow}>
          <Ionicons name="lock-closed-outline" size={20} color={Colors.neutral} style={styles.inputIcon} />
          <TextInput
            style={[styles.input, styles.passwordInput]}
            placeholder="Şifre"
            placeholderTextColor={Colors.textMuted}
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
              color={Colors.neutral}
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
  container: { flex: 1, backgroundColor: Colors.background },
  inner: { flex: 1, paddingHorizontal: Spacing.lg, paddingTop: 60, alignItems: "stretch" },
  logoBox: { alignItems: "center", marginBottom: Spacing.sm },
  logo: { fontSize: 28, fontWeight: "bold", color: Colors.primary, marginTop: 4 },
  subtitle: { fontSize: 15, color: Colors.textSecondary, textAlign: "center", marginBottom: 28 },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.dangerLight,
    borderRadius: Radius.sm,
    padding: 10,
    marginBottom: 12,
    gap: Spacing.sm,
  },
  error: { color: Colors.danger, ...Typography.caption, flex: 1 },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.borderStrong,
    borderRadius: Radius.md,
    marginBottom: 12,
    paddingHorizontal: 12,
    minHeight: MinTapTarget,
  },
  inputIcon: { marginRight: Spacing.sm },
  input: { flex: 1, paddingVertical: 14, fontSize: 16, color: Colors.textPrimary },
  passwordInput: { paddingRight: 40 },
  showBtn: { padding: 6, minWidth: MinTapTarget, minHeight: MinTapTarget, justifyContent: "center", alignItems: "center" },
  btn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 4,
    minHeight: MinTapTarget,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: Colors.surface, fontSize: 16, fontWeight: "600" },
  divider: { flexDirection: "row", alignItems: "center", marginVertical: 20 },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.border },
  dividerText: { marginHorizontal: 12, color: Colors.textMuted, ...Typography.caption },
  googleBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.borderStrong,
    borderRadius: Radius.md,
    paddingVertical: 14,
    gap: 10,
    minHeight: MinTapTarget,
  },
  googleBtnText: { fontSize: 15, color: Colors.textPrimary, fontWeight: "500" },
  link: { alignItems: "center", paddingVertical: 10, marginTop: 4 },
  linkText: { color: Colors.textSecondary, fontSize: 14 },
  linkBold: { color: Colors.primary, fontWeight: "600" },
});
