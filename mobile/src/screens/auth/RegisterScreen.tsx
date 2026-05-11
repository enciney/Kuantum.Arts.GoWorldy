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
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useAuth } from "../../context/AuthContext";
import { Colors, Typography, Spacing, Radius, MinTapTarget } from "../../theme";

type UserType = "emigrant" | "consultant" | "diaspora";

const USER_TYPE_OPTIONS: { value: UserType; label: string; description: string }[] = [
  { value: "emigrant", label: "Göç Etmek İstiyorum", description: "Yurt dışına taşınmayı planlıyorum" },
  { value: "consultant", label: "Danışman", description: "Göç sürecinde profesyonel destek sağlıyorum" },
  { value: "diaspora", label: "Zaten Yurt Dışındayım", description: "Yurt dışında yaşıyorum" },
];

type Props = {
  onNavigateLogin: () => void;
};

export function RegisterScreen({ onNavigateLogin }: Props) {
  const { register } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [userType, setUserType] = useState<UserType>("emigrant");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRegister = async () => {
    if (!displayName || !email || !password) {
      setError("Tüm alanlar zorunludur.");
      return;
    }
    if (password.length < 6) {
      setError("Şifre en az 6 karakter olmalıdır.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await register(email.trim(), password, displayName.trim(), userType);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Kayıt başarısız.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled">
        <View style={styles.logoBox}>
          <MaterialCommunityIcons name="earth" size={56} color={Colors.primary} />
          <Text style={styles.logo}>GoWorldy</Text>
        </View>
        <Text style={styles.title}>Hesap Oluştur</Text>

        {error && (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={18} color={Colors.danger} />
            <Text style={styles.error}>{error}</Text>
          </View>
        )}

        <Text style={styles.label}>Ad Soyad</Text>
        <TextInput
          style={styles.input}
          placeholder="Adınız Soyadınız"
          placeholderTextColor={Colors.textMuted}
          value={displayName}
          onChangeText={setDisplayName}
          autoCorrect={false}
        />

        <Text style={styles.label}>E-posta</Text>
        <TextInput
          style={styles.input}
          placeholder="ornek@email.com"
          placeholderTextColor={Colors.textMuted}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />

        <Text style={styles.label}>Şifre</Text>
        <TextInput
          style={styles.input}
          placeholder="En az 6 karakter"
          placeholderTextColor={Colors.textMuted}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <Text style={styles.label}>Profil Türü</Text>
        <View style={styles.typeRow}>
          {USER_TYPE_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              style={[styles.typeCard, userType === opt.value && styles.typeCardSelected]}
              onPress={() => setUserType(opt.value)}
            >
              <Text
                style={[styles.typeLabel, userType === opt.value && styles.typeLabelSelected]}
              >
                {opt.label}
              </Text>
              <Text style={styles.typeDesc}>{opt.description}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.btn, loading && styles.btnDisabled]}
          onPress={handleRegister}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.btnText}>Kayıt Ol</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={onNavigateLogin} style={styles.link}>
          <Text style={styles.linkText}>
            Hesabın var mı? <Text style={styles.linkBold}>Giriş Yap</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  inner: { paddingHorizontal: Spacing.lg, paddingTop: 20, paddingBottom: 40 },
  logoBox: { alignItems: "center", marginBottom: Spacing.sm },
  logo: { fontSize: 28, fontWeight: "bold", color: Colors.primary, marginTop: 4 },
  title: {
    ...Typography.h1,
    color: Colors.textPrimary,
    marginBottom: Spacing.lg,
    textAlign: "center",
  },
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
  label: { ...Typography.label, color: Colors.textPrimary, marginBottom: 6 },
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
  typeRow: { gap: Spacing.sm, marginBottom: Spacing.lg },
  typeCard: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.borderStrong,
    borderRadius: Radius.md,
    padding: Spacing.md,
  },
  typeCardSelected: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  typeLabel: { fontSize: 15, fontWeight: "600", color: Colors.textPrimary, marginBottom: 4 },
  typeLabelSelected: { color: Colors.primary },
  typeDesc: { ...Typography.caption, color: Colors.textSecondary },
  btn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: Spacing.md,
    minHeight: MinTapTarget,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: Colors.surface, fontSize: 16, fontWeight: "600" },
  link: { alignItems: "center", paddingVertical: Spacing.sm },
  linkText: { color: Colors.textSecondary, fontSize: 14 },
  linkBold: { color: Colors.primary, fontWeight: "600" },
});
