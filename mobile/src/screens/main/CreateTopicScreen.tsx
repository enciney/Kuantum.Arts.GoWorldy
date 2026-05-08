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
  Alert,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../services/api";

const TOPIC_COST_TL = 50;

interface Props {
  categoryId: string;
  categoryName: string;
  onCancel: () => void;
  onCreated: () => void;
}

export function CreateTopicScreen({ categoryId, categoryName, onCancel, onCreated }: Props) {
  const { token, user } = useAuth();
  const [title, setTitle] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const isStaff = user?.role === "admin" || user?.role === "moderator";

  const handleConfirm = () => {
    if (!title.trim()) {
      Alert.alert("Eksik", "Konu başlığı boş olamaz.");
      return;
    }
    if (title.trim().length < 10) {
      Alert.alert("Çok kısa", "Başlık en az 10 karakter olmalı.");
      return;
    }
    if (isStaff) {
      // Admin/moderator: paywall yok, direkt oluştur.
      doCreate();
      return;
    }
    Alert.alert(
      "Konu açma ücreti",
      `Bu işlem ${TOPIC_COST_TL} TL kredi düşecek. Onaylıyor musun?`,
      [
        { text: "İptal", style: "cancel" },
        { text: `${TOPIC_COST_TL} TL onayla`, onPress: doCreate },
      ]
    );
  };

  const doCreate = async () => {
    if (!token) return;
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
      // Backend 402 PAYMENT_REQUIRED → paywall mesajı
      if (msg.includes("premium") || msg.includes("kredi")) {
        Alert.alert(
          "Premium gerekli",
          "Yeni konu açabilmek için premium üyelik veya yeterli krediye ihtiyacın var.",
          [{ text: "Tamam" }]
        );
      } else {
        Alert.alert("Hata", msg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={onCancel} style={styles.closeBtn}>
          <Ionicons name="close" size={26} color="#6B7280" />
        </TouchableOpacity>
        <Text style={styles.title}>Yeni Konu</Text>
        <View style={{ width: 38 }} />
      </View>

      <View style={styles.body}>
        <View style={styles.categoryBox}>
          <Ionicons name="folder" size={18} color="#2563EB" />
          <Text style={styles.categoryText}>{categoryName}</Text>
        </View>

        <Text style={styles.label}>Konu Başlığı</Text>
        <TextInput
          style={styles.input}
          placeholder="Örn: Almanya'da Blue Card başvuru süreci..."
          placeholderTextColor="#9CA3AF"
          value={title}
          onChangeText={setTitle}
          maxLength={120}
          multiline
        />
        <Text style={styles.charCount}>{title.length} / 120</Text>

        {isStaff ? (
          <View style={[styles.infoBox, styles.infoBoxStaff]}>
            <MaterialCommunityIcons name="shield-check" size={18} color="#10B981" />
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
            <MaterialCommunityIcons name="information" size={18} color="#F59E0B" />
            <View style={{ flex: 1, marginLeft: 8 }}>
              <Text style={styles.infoTitle}>Konu açma ücretlidir</Text>
              <Text style={styles.infoText}>
                Yeni konu açmak <Text style={{ fontWeight: "bold" }}>{TOPIC_COST_TL} TL</Text> kredi gerektirir. Konu moderatör onayından sonra yayına girer.
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
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="send" size={18} color="#fff" />
              <Text style={styles.btnText}>Onayla ve Gönder</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 8,
    paddingTop: 56,
    paddingBottom: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  closeBtn: { padding: 6 },
  title: { fontSize: 18, fontWeight: "bold", color: "#111827" },
  body: { padding: 16 },
  categoryBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 9999,
    alignSelf: "flex-start",
    gap: 6,
    marginBottom: 16,
  },
  categoryText: { fontSize: 13, color: "#2563EB", fontWeight: "600" },
  label: { fontSize: 14, fontWeight: "500", color: "#374151", marginBottom: 6 },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: "#111827",
    minHeight: 80,
    textAlignVertical: "top",
  },
  charCount: { fontSize: 11, color: "#9CA3AF", textAlign: "right", marginTop: 4 },
  infoBox: {
    flexDirection: "row",
    backgroundColor: "#FFFBEB",
    borderRadius: 12,
    padding: 12,
    marginTop: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#FDE68A",
  },
  infoBoxStaff: { backgroundColor: "#ECFDF5", borderColor: "#A7F3D0" },
  infoTitle: { fontSize: 13, fontWeight: "600", color: "#92400E", marginBottom: 2 },
  infoText: { fontSize: 12, color: "#78350F", lineHeight: 17 },
  btn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2563EB",
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
