import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../services/api";
import { CreditGateModal } from "../../components/CreditGateModal";
import { Colors, Typography, Spacing, Radius, MinTapTarget } from "../../theme";

const TOPIC_COST = 50;

interface Props {
  categoryId: string;
  categoryName: string;
  onCancel: () => void;
  onCreated: () => void;
  onNavigatePremium?: () => void;
}

export function CreateTopicScreen({ categoryId, categoryName, onCancel, onCreated, onNavigatePremium }: Props) {
  const { token, user } = useAuth();
  const [title, setTitle] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [userCredits, setUserCredits] = useState(0);
  const [gateVisible, setGateVisible] = useState(false);

  const isStaff = user?.role === "admin" || user?.role === "moderator";

  useEffect(() => {
    if (!token || isStaff) return;
    api.users.me(token).then((u) => setUserCredits(u.credits)).catch(() => {});
  }, [token, isStaff]);

  const validateTitle = (): boolean => {
    if (!title.trim()) {
      Alert.alert("Eksik", "Konu başlığı boş olamaz.");
      return false;
    }
    if (title.trim().length < 10) {
      Alert.alert("Çok kısa", "Başlık en az 10 karakter olmalı.");
      return false;
    }
    return true;
  };

  const handleConfirm = () => {
    if (!validateTitle()) return;
    if (isStaff) {
      doCreate();
      return;
    }
    setGateVisible(true);
  };

  const doCreate = async () => {
    if (!token) return;
    setGateVisible(false);
    setSubmitting(true);
    try {
      await api.forum.createTopic(categoryId, title.trim(), token);
      Alert.alert(
        isStaff ? "Konu yayınlandı" : "Konu gönderildi",
        isStaff
          ? "Konunuz hemen yayına alındı."
          : "Konunuz moderatör onayı bekliyor. Onaylandığında yayına alınacak.",
        [{ text: "Tamam", onPress: onCreated }]
      );
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Bilinmeyen hata.";
      if (msg.includes("premium") || msg.includes("kredi")) {
        Alert.alert(
          "Yetersiz Kredi",
          "Yeni konu açabilmek için yeterli kredin yok. Premium üyeliğe geçerek sınırsız konu açabilirsin.",
          [
            { text: "İptal", style: "cancel" },
            { text: "Premium'a Geç", onPress: () => onNavigatePremium?.() },
          ]
        );
      } else {
        Alert.alert("Hata", msg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={onCancel} style={styles.closeBtn}>
            <Ionicons name="close" size={26} color={Colors.textSecondary} />
          </TouchableOpacity>
          <Text style={styles.title}>Yeni Konu</Text>
          <View style={{ width: MinTapTarget }} />
        </View>

        <View style={styles.body}>
          <View style={styles.categoryBox}>
            <Ionicons name="folder" size={18} color={Colors.primary} />
            <Text style={styles.categoryText}>{categoryName}</Text>
          </View>

          <Text style={styles.label}>Konu Başlığı</Text>
          <TextInput
            style={styles.input}
            placeholder="Örn: Almanya'da Blue Card başvuru süreci..."
            placeholderTextColor={Colors.textMuted}
            value={title}
            onChangeText={setTitle}
            maxLength={120}
            multiline
          />
          <Text style={styles.charCount}>{title.length} / 120</Text>

          {isStaff ? (
            <View style={[styles.infoBox, styles.infoBoxStaff]}>
              <MaterialCommunityIcons name="shield-check" size={18} color={Colors.secondary} />
              <View style={{ flex: 1, marginLeft: 8 }}>
                <Text style={[styles.infoTitle, { color: "#065F46" }]}>
                  {user?.role === "admin" ? "Admin yetkisi" : "Moderatör yetkisi"}
                </Text>
                <Text style={[styles.infoText, { color: "#047857" }]}>
                  Konunuz ücretsiz ve doğrudan yayına alınır.
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.infoBox}>
              <MaterialCommunityIcons name="information" size={18} color={Colors.warning} />
              <View style={{ flex: 1, marginLeft: 8 }}>
                <Text style={styles.infoTitle}>Konu açma ücretlidir</Text>
                <Text style={styles.infoText}>
                  Yeni konu açmak <Text style={{ fontWeight: "bold" }}>{TOPIC_COST} kredi</Text> gerektirir. Konu moderatör onayından sonra yayına girer.
                </Text>
              </View>
            </View>
          )}

          <TouchableOpacity
            style={[styles.btn, submitting && styles.btnDisabled]}
            onPress={handleConfirm}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color={Colors.surface} />
            ) : (
              <>
                <Ionicons name="send" size={18} color={Colors.surface} />
                <Text style={styles.btnText}>Onayla ve Gönder</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      <CreditGateModal
        visible={gateVisible}
        actionLabel="Yeni konu açma"
        cost={TOPIC_COST}
        userCredits={userCredits}
        deducting={submitting}
        onDeduct={doCreate}
        onBuy={() => {
          setGateVisible(false);
          onNavigatePremium?.();
        }}
        onClose={() => setGateVisible(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.sm,
    paddingTop: 56,
    paddingBottom: 12,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  closeBtn: {
    padding: 6,
    minWidth: MinTapTarget,
    minHeight: MinTapTarget,
    justifyContent: "center",
  },
  title: { ...Typography.h2, color: Colors.textPrimary },
  body: { padding: Spacing.md },
  categoryBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.full,
    alignSelf: "flex-start",
    gap: 6,
    marginBottom: Spacing.md,
  },
  categoryText: { ...Typography.caption, color: Colors.primary, fontWeight: "600" },
  label: { ...Typography.caption, fontWeight: "500", color: Colors.textPrimary, marginBottom: 6 },
  input: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.borderStrong,
    borderRadius: Radius.md,
    padding: 14,
    fontSize: 16,
    color: Colors.textPrimary,
    minHeight: 80,
    textAlignVertical: "top",
  },
  charCount: { ...Typography.small, color: Colors.textMuted, textAlign: "right", marginTop: 4 },
  infoBox: {
    flexDirection: "row",
    backgroundColor: Colors.warningLight,
    borderRadius: Radius.md,
    padding: 12,
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: "#FDE68A",
  },
  infoBoxStaff: { backgroundColor: "#ECFDF5", borderColor: "#A7F3D0" },
  infoTitle: { ...Typography.caption, fontWeight: "600", color: "#92400E", marginBottom: 2 },
  infoText: { ...Typography.small, color: "#78350F", lineHeight: 17 },
  btn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    paddingVertical: 16,
    gap: 8,
    minHeight: MinTapTarget,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
