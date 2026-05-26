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
  Modal,
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
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [kvkkAccepted, setKvkkAccepted] = useState(false);
  const [showKvkk, setShowKvkk] = useState(false);

  const handleRegister = async () => {
    if (!displayName || !email || !password) {
      setError("Tüm alanlar zorunludur.");
      return;
    }
    if (password.length < 6) {
      setError("Şifre en az 6 karakter olmalıdır.");
      return;
    }
    if (!kvkkAccepted) {
      setError("Kayıt olabilmek için Gizlilik Politikası ve KVKK Aydınlatma Metni'ni kabul etmeniz gerekiyor.");
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
        <View style={styles.passwordRow}>
          <TextInput
            style={styles.passwordField}
            placeholder="En az 6 karakter"
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
          style={styles.kvkkRow}
          onPress={() => setKvkkAccepted((v) => !v)}
          activeOpacity={0.8}
        >
          <View style={[styles.checkbox, kvkkAccepted && styles.checkboxChecked]}>
            {kvkkAccepted && <Ionicons name="checkmark" size={14} color="#fff" />}
          </View>
          <Text style={styles.kvkkText}>
            <Text onPress={() => setShowKvkk(true)} style={styles.kvkkLink}>
              Gizlilik Politikası ve KVKK Aydınlatma Metni
            </Text>
            {"'ni okudum, kabul ediyorum."}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.btn, (loading || !kvkkAccepted) && styles.btnDisabled]}
          onPress={handleRegister}
          disabled={loading || !kvkkAccepted}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.btnText}>Kayıt Ol</Text>
          )}
        </TouchableOpacity>

        <Modal visible={showKvkk} animationType="slide" presentationStyle="pageSheet">
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Gizlilik Politikası ve KVKK</Text>
              <TouchableOpacity onPress={() => setShowKvkk(false)} style={styles.modalClose}>
                <Ionicons name="close" size={24} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScroll} contentContainerStyle={styles.modalContent}>
              <Text style={styles.modalSectionTitle}>1. Veri Sorumlusu</Text>
              <Text style={styles.modalText}>
                GoWorldy uygulaması kapsamında kişisel verileriniz, 6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") uyarınca veri sorumlusu sıfatıyla Kuantum Arts tarafından işlenmektedir.
              </Text>
              <Text style={styles.modalSectionTitle}>2. İşlenen Kişisel Veriler</Text>
              <Text style={styles.modalText}>
                Ad soyad, e-posta adresi, şifre (hash'lenmiş), kullanıcı tipi, profil bilgileri, forum içerikleri (konu/yorum), ödeme işlem kayıtları ve uygulama kullanım verileri işlenmektedir.
              </Text>
              <Text style={styles.modalSectionTitle}>3. İşleme Amaçları</Text>
              <Text style={styles.modalText}>
                • Hesap oluşturma ve kimlik doğrulama{"\n"}
                • Forum hizmetlerinin sunulması{"\n"}
                • Premium üyelik ve ödeme işlemleri{"\n"}
                • Uygulama güvenliği ve hile önleme{"\n"}
                • Yasal yükümlülüklerin yerine getirilmesi
              </Text>
              <Text style={styles.modalSectionTitle}>4. Hukuki Dayanak</Text>
              <Text style={styles.modalText}>
                Verileriniz; sözleşmenin ifası (KVKK m.5/2-c), meşru menfaat (KVKK m.5/2-f) ve açık rızanız (KVKK m.5/1) hukuki sebeplerine dayalı olarak işlenmektedir.
              </Text>
              <Text style={styles.modalSectionTitle}>5. Veri Saklama ve Aktarım</Text>
              <Text style={styles.modalText}>
                Kişisel verileriniz, hizmet sunumu için gerekli olan süre boyunca saklanır. Ödeme verileri için Stripe, e-posta bildirimleri için SendGrid, kimlik doğrulama için Google altyapısı kullanılabilir.
              </Text>
              <Text style={styles.modalSectionTitle}>6. Haklarınız (KVKK m.11)</Text>
              <Text style={styles.modalText}>
                Kişisel verilerinize ilişkin; bilgi talep etme, düzeltme, silme, işlemeye itiraz etme ve taşınabilirlik haklarınız mevcuttur. Taleplerinizi destek@goworldy.com adresine iletebilirsiniz.
              </Text>
              <Text style={styles.modalSectionTitle}>7. Çerez ve Analitik</Text>
              <Text style={styles.modalText}>
                Uygulama, hizmet kalitesini artırmak amacıyla anonim kullanım istatistikleri toplayabilir. Kişisel tanımlayıcı çerez kullanılmamaktadır.
              </Text>
              <Text style={styles.modalSectionTitle}>8. Değişiklikler</Text>
              <Text style={styles.modalText}>
                Bu politika zaman zaman güncellenebilir. Önemli değişikliklerde uygulama üzerinden bildirim yapılır.{"\n\n"}
                Son güncelleme: Mayıs 2026
              </Text>
            </ScrollView>
            <TouchableOpacity
              style={styles.modalAcceptBtn}
              onPress={() => { setKvkkAccepted(true); setShowKvkk(false); }}
            >
              <Text style={styles.modalAcceptBtnText}>Okudum, Kabul Ediyorum</Text>
            </TouchableOpacity>
          </View>
        </Modal>

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
  passwordRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.borderStrong,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    minHeight: MinTapTarget,
  },
  passwordField: { flex: 1, paddingVertical: 14, fontSize: 16, color: Colors.textPrimary },
  showBtn: { padding: 6, minWidth: MinTapTarget, minHeight: MinTapTarget, justifyContent: "center", alignItems: "center" },
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
  kvkkRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
    paddingHorizontal: 2,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: Colors.borderStrong,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 1,
    flexShrink: 0,
  },
  checkboxChecked: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  kvkkText: {
    flex: 1,
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  kvkkLink: {
    color: Colors.primary,
    fontWeight: "500",
    textDecorationLine: "underline",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    paddingTop: 56,
    paddingBottom: Spacing.md,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  modalClose: {
    padding: Spacing.xs,
    minWidth: 44,
    minHeight: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  modalScroll: { flex: 1 },
  modalContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  modalSectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginTop: Spacing.md,
    marginBottom: 6,
  },
  modalText: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  modalAcceptBtn: {
    backgroundColor: Colors.primary,
    margin: Spacing.md,
    borderRadius: Radius.md,
    paddingVertical: 16,
    alignItems: "center",
  },
  modalAcceptBtnText: {
    color: Colors.surface,
    fontSize: 16,
    fontWeight: "600",
  },
});
