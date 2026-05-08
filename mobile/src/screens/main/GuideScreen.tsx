import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../services/api";

interface Step {
  id: string;
  order: number;
  question: string;
  description?: string;
}

interface Progress {
  id: string;
  stepId: string;
  answer: string;
  completedAt: string;
}

interface Country {
  id: string;
  name: string;
  code: string;
}

const FLAG_MAP: Record<string, string> = {
  US: "🇺🇸", DE: "🇩🇪", GB: "🇬🇧", CA: "🇨🇦",
  AU: "🇦🇺", NL: "🇳🇱", FR: "🇫🇷", TR: "🇹🇷",
};

const COUNTRY_NAME_MAP: Record<string, string> = {
  US: "ABD", DE: "Almanya", GB: "İngiltere", CA: "Kanada",
  AU: "Avustralya", NL: "Hollanda", FR: "Fransa", TR: "Türkiye",
};

export function GuideScreen() {
  const { token } = useAuth();
  const [countries, setCountries] = useState<Country[]>([]);
  const [selectedCountryId, setSelectedCountryId] = useState<string>("");
  const [steps, setSteps] = useState<Step[]>([]);
  const [progress, setProgress] = useState<Progress[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Answer modal state
  const [activeStep, setActiveStep] = useState<Step | null>(null);
  const [answer, setAnswer] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!token) return;
    api.forum
      .getCountries(token)
      .then((data) => {
        setCountries(data);
        if (data.length > 0) setSelectedCountryId(data[0].id);
      })
      .catch((e: unknown) =>
        setError(e instanceof Error ? e.message : "Ülkeler yüklenemedi.")
      );
  }, [token]);

  const loadStepsAndProgress = async () => {
    if (!token || !selectedCountryId) return;
    try {
      const [s, p] = await Promise.all([
        api.guide.getSteps(selectedCountryId, token),
        api.guide.getProgress(token),
      ]);
      setSteps(s);
      setProgress(p);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Yüklenemedi.");
    }
  };

  useEffect(() => {
    if (!token || !selectedCountryId) return;
    setLoading(true);
    setError(null);
    loadStepsAndProgress().finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, selectedCountryId]);

  const completedMap = new Map(progress.map((p) => [p.stepId, p]));
  const completionPct =
    steps.length > 0
      ? Math.round((completedMap.size / steps.length) * 100)
      : 0;

  const openStep = (step: Step) => {
    setActiveStep(step);
    setAnswer(completedMap.get(step.id)?.answer || "");
  };

  const closeModal = () => {
    setActiveStep(null);
    setAnswer("");
  };

  const handleSave = async () => {
    if (!token || !activeStep) return;
    if (!answer.trim()) {
      Alert.alert("Eksik", "Cevap boş olamaz.");
      return;
    }
    setSaving(true);
    try {
      await api.guide.saveProgress(activeStep.id, answer.trim(), token);
      await loadStepsAndProgress();
      closeModal();
    } catch (e: unknown) {
      Alert.alert("Hata", e instanceof Error ? e.message : "Kaydedilemedi.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Rehberim</Text>

      {/* Country selector */}
      <FlatList
        horizontal
        data={countries}
        keyExtractor={(c) => c.id}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.countryList}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.countryChip,
              selectedCountryId === item.id && styles.countryChipSelected,
            ]}
            onPress={() => setSelectedCountryId(item.id)}
            activeOpacity={0.7}
          >
            <Text style={styles.countryFlag}>{FLAG_MAP[item.code] ?? "🌍"}</Text>
            <Text
              style={[
                styles.countryChipText,
                selectedCountryId === item.id && styles.countryChipTextSelected,
              ]}
            >
              {COUNTRY_NAME_MAP[item.code] ?? item.name}
            </Text>
          </TouchableOpacity>
        )}
      />

      {/* Progress bar */}
      <View style={styles.progressContainer}>
        <Text style={styles.progressLabel}>Tamamlanan: %{completionPct}</Text>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${completionPct}%` }]} />
        </View>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color="#2563EB" />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : (
        <FlatList
          data={steps}
          keyExtractor={(s) => s.id}
          contentContainerStyle={styles.stepList}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.emptyText}>Bu ülke için henüz adım yok.</Text>
            </View>
          }
          renderItem={({ item, index }) => {
            const completedProgress = completedMap.get(item.id);
            const done = !!completedProgress;
            return (
              <TouchableOpacity
                style={[styles.stepRow, done && styles.stepRowDone]}
                onPress={() => openStep(item)}
                activeOpacity={0.7}
              >
                <View style={[styles.stepDot, done && styles.stepDotDone]}>
                  {done ? (
                    <Ionicons name="checkmark" size={18} color="#fff" />
                  ) : (
                    <Text style={styles.stepNum}>{String(index + 1)}</Text>
                  )}
                </View>
                <View style={styles.stepContent}>
                  <Text style={[styles.stepQuestion, done && styles.stepQuestionDone]}>
                    {item.question}
                  </Text>
                  {item.description && (
                    <Text style={styles.stepDesc}>{item.description}</Text>
                  )}
                  {completedProgress && (
                    <View style={styles.answerBox}>
                      <MaterialCommunityIcons
                        name="comment-check-outline"
                        size={14}
                        color="#10B981"
                      />
                      <Text style={styles.answerText} numberOfLines={2}>
                        {completedProgress.answer}
                      </Text>
                    </View>
                  )}
                </View>
                <Ionicons
                  name={done ? "pencil-outline" : "chevron-forward"}
                  size={18}
                  color="#9CA3AF"
                  style={styles.stepArrow}
                />
              </TouchableOpacity>
            );
          }}
        />
      )}

      {/* Answer Modal */}
      <Modal
        visible={!!activeStep}
        animationType="slide"
        transparent
        onRequestClose={closeModal}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalLabel}>Adım</Text>
              <TouchableOpacity onPress={closeModal} style={styles.modalClose}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalQuestion}>{activeStep?.question}</Text>
            {activeStep?.description && (
              <Text style={styles.modalDesc}>{activeStep.description}</Text>
            )}

            <Text style={styles.modalInputLabel}>Cevabın</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Cevabını veya notunu yaz..."
              placeholderTextColor="#9CA3AF"
              value={answer}
              onChangeText={setAnswer}
              multiline
              autoFocus
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancel}
                onPress={closeModal}
                activeOpacity={0.7}
              >
                <Text style={styles.modalCancelText}>İptal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalSave, saving && { opacity: 0.6 }]}
                onPress={handleSave}
                disabled={saving}
                activeOpacity={0.7}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Ionicons name="checkmark" size={18} color="#fff" />
                    <Text style={styles.modalSaveText}>Kaydet</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#111827",
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 12,
  },
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24 },
  countryList: { paddingHorizontal: 16, paddingBottom: 12, gap: 8 },
  countryChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 9999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 6,
  },
  countryChipSelected: { backgroundColor: "#EFF6FF", borderColor: "#2563EB" },
  countryFlag: { fontSize: 18 },
  countryChipText: { fontSize: 14, color: "#6B7280", fontWeight: "500" },
  countryChipTextSelected: { color: "#2563EB" },
  progressContainer: { paddingHorizontal: 16, marginBottom: 16 },
  progressLabel: { fontSize: 13, color: "#6B7280", marginBottom: 6 },
  progressTrack: {
    height: 8,
    backgroundColor: "#E5E7EB",
    borderRadius: 9999,
    overflow: "hidden",
  },
  progressFill: { height: 8, backgroundColor: "#10B981", borderRadius: 9999 },
  stepList: { paddingHorizontal: 16, paddingBottom: 24 },
  stepRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 10,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    gap: 10,
  },
  stepRowDone: { backgroundColor: "#F0FDF4", borderColor: "#BBF7D0" },
  stepArrow: { alignSelf: "center" },
  stepDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#D1D5DB",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  stepDotDone: { backgroundColor: "#10B981", borderColor: "#10B981" },
  stepNum: { fontSize: 13, fontWeight: "600", color: "#6B7280" },
  stepContent: { flex: 1, paddingTop: 4 },
  stepQuestion: { fontSize: 15, fontWeight: "600", color: "#111827", marginBottom: 4 },
  stepQuestionDone: { color: "#065F46" },
  stepDesc: { fontSize: 13, color: "#6B7280", lineHeight: 18 },
  answerBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 6,
    gap: 6,
    borderWidth: 1,
    borderColor: "#D1FAE5",
  },
  answerText: { fontSize: 12, color: "#065F46", flex: 1 },
  errorText: { color: "#EF4444", fontSize: 15 },
  emptyText: { color: "#6B7280", fontSize: 15 },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 32,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  modalLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#2563EB",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  modalClose: { padding: 4 },
  modalQuestion: { fontSize: 18, fontWeight: "600", color: "#111827", marginBottom: 6 },
  modalDesc: { fontSize: 13, color: "#6B7280", lineHeight: 18, marginBottom: 16 },
  modalInputLabel: { fontSize: 13, fontWeight: "500", color: "#374151", marginBottom: 6 },
  modalInput: {
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    color: "#111827",
    minHeight: 100,
    textAlignVertical: "top",
    marginBottom: 16,
  },
  modalActions: { flexDirection: "row", gap: 8 },
  modalCancel: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    backgroundColor: "#F3F4F6",
  },
  modalCancelText: { color: "#6B7280", fontWeight: "600", fontSize: 15 },
  modalSave: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2563EB",
    gap: 6,
  },
  modalSaveText: { color: "#fff", fontWeight: "600", fontSize: 15 },
});
