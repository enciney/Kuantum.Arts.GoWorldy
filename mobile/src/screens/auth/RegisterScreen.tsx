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
import { useAuth } from "../../context/AuthContext";

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
        <Text style={styles.title}>Hesap Oluştur</Text>

        {error && <Text style={styles.error}>{error}</Text>}

        <Text style={styles.label}>Ad Soyad</Text>
        <TextInput
          style={styles.input}
          placeholder="Adınız Soyadınız"
          placeholderTextColor="#9CA3AF"
          value={displayName}
          onChangeText={setDisplayName}
          autoCorrect={false}
        />

        <Text style={styles.label}>E-posta</Text>
        <TextInput
          style={styles.input}
          placeholder="ornek@email.com"
          placeholderTextColor="#9CA3AF"
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
          placeholderTextColor="#9CA3AF"
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
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  inner: { paddingHorizontal: 24, paddingTop: 60, paddingBottom: 40 },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 24,
    textAlign: "center",
  },
  error: { color: "#EF4444", fontSize: 14, marginBottom: 12, textAlign: "center" },
  label: { fontSize: 14, fontWeight: "500", color: "#374151", marginBottom: 6 },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: "#111827",
    marginBottom: 16,
  },
  typeRow: { gap: 8, marginBottom: 24 },
  typeCard: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 12,
    padding: 16,
  },
  typeCardSelected: { borderColor: "#2563EB", backgroundColor: "#EFF6FF" },
  typeLabel: { fontSize: 15, fontWeight: "600", color: "#111827", marginBottom: 4 },
  typeLabelSelected: { color: "#2563EB" },
  typeDesc: { fontSize: 13, color: "#6B7280" },
  btn: {
    backgroundColor: "#2563EB",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 16,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  link: { alignItems: "center", paddingVertical: 8 },
  linkText: { color: "#6B7280", fontSize: 14 },
  linkBold: { color: "#2563EB", fontWeight: "600" },
});
