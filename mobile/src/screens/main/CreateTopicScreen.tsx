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
import { Toast, ToastVariant } from "../../components/Toast";
import { Colors, Typography, Spacing, Radius, MinTapTarget } from "../../theme";
import { hasActivePremium } from "../../utils/premium";
import { buildPostCreateAction } from "./createTopicHandlers";

interface Props {
  categoryId: string;
  categoryName: string;
  onCancel: () => void;
  onCreated: (topicId?: string, topicTitle?: string, topicAuthorId?: string) => void;
  onNavigatePremium?: () => void;
}

export function CreateTopicScreen({ categoryId, categoryName, onCancel, onCreated, onNavigatePremium }: Props) {
  const { token, user } = useAuth();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState(""); // FRM-TPC-003
  const [submitting, setSubmitting] = useState(false);
  const [premiumLoading, setPremiumLoading] = useState(true);
  const [toast, setToast] = useState<{ visible: boolean; message: string; variant: ToastVariant }>({
    visible: false,
    message: "",
    variant: "success",
  });

  const isStaff = user?.role === "admin" || user?.role === "moderator";
  const hasPremium = hasActivePremium(user);
  const isFree = isStaff || hasPremium;

  useEffect(() => {
    // Premium durumu user context'ten gelir — ek fetch gerekmez
    setPremiumLoading(false);
  }, []);

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
    if (!isFree) {
      Alert.alert(
        "Premium Gerekli",
        "Yeni konu açmak için premium üyelik gereklidir.",
        [
          { text: "İptal", style: "cancel" },
          { text: "Premium'a Geç", onPress: () => onNavigatePremium?.() },
        ]
      );
      return;
    }
    doCreate();
  };

  const doCreate = async () => {
    if (!token) return;
    setSubmitting(true);
    try {
      const created = await api.forum.createTopic(
        categoryId,
        title.trim(),
        token,
        content.trim() || undefined
      );
      const action = buildPostCreateAction(created, isStaff);
      setToast({ visible: true, message: action.toast.message, variant: action.toast.variant });
      setTimeout(() => {
        onCreated(created.id, created.title, created.authorId);
      }, 1200);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Bilinmeyen hata.";
      if (msg.toLowerCase().includes("premium")) {
        Alert.alert(
          "Premium Gerekli",
          "Yeni konu açmak için premium üyelik gereklidir.",
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

          {/* FRM-TPC-003: Konu içeriği (opsiyonel) */}
          <Text style={[styles.label, { marginTop: Spacing.md }]}>Konu İçeriği (opsiyonel)</Text>
          <TextInput
            style={[styles.input, styles.bodyInput]}
            placeholder="Detaylı anlatımını buraya yazabilirsin..."
            placeholderTextColor={Colors.textMuted}
            value={content}
            onChangeText={setContent}
            maxLength={5000}
            multiline
            textAlignVertical="top"
          />
          <Text style={styles.charCount}>{content.length} / 5000</Text>

          {premiumLoading ? (
            <View style={styles.infoBox}>
              <ActivityIndicator color={Colors.primary} />
              <View style={{ flex: 1, marginLeft: 8 }}>
                <Text style={styles.infoTitle}>Yükleniyor…</Text>
                <Text style={styles.infoText}>Üyelik durumunuz kontrol ediliyor.</Text>
              </View>
            </View>
          ) : isStaff ? (
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
          ) : hasPremium ? (
            <View style={[styles.infoBox, styles.infoBoxPremium]}>
              <MaterialCommunityIcons name="crown" size={18} color="#7C3AED" />
              <View style={{ flex: 1, marginLeft: 8 }}>
                <Text style={[styles.infoTitle, { color: "#4C1D95" }]}>Premium üye — ücretsiz</Text>
                <Text style={[styles.infoText, { color: "#5B21B6" }]}>
                  Premium üyeliğiniz sayesinde sınırsız konu açabilirsiniz.
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.infoBox}>
              <MaterialCommunityIcons name="information" size={18} color={Colors.warning} />
              <View style={{ flex: 1, marginLeft: 8 }}>
                <Text style={styles.infoTitle}>Premium üyelik gerekli</Text>
                <Text style={styles.infoText}>
                  Yeni konu açmak için premium üye olmanız gerekir. Konu moderatör onayından sonra yayına girer.
                </Text>
              </View>
            </View>
          )}

          <TouchableOpacity
            style={[styles.btn, (submitting || premiumLoading) && styles.btnDisabled]}
            onPress={handleConfirm}
            disabled={submitting || premiumLoading}
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

      <Toast
        visible={toast.visible}
        message={toast.message}
        variant={toast.variant}
        onClose={() => setToast((t) => ({ ...t, visible: false }))}
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
  bodyInput: { minHeight: 140, paddingTop: 12 },
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
  infoBoxPremium: { backgroundColor: "#EDE9FE", borderColor: "#C4B5FD" },
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
