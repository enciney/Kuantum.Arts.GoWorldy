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
import { Colors, Typography, Spacing, Radius, MinTapTarget } from "../../theme";

interface Step {
  id: string;
  order: number;
  question: string;
  description?: string;
  blockingAnswer?: string;
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

type StepState = "completed" | "active" | "locked" | "disqualified";

const FLAG_MAP: Record<string, string> = {
  US: "🇺🇸", DE: "🇩🇪", GB: "🇬🇧", CA: "🇨🇦",
  AU: "🇦🇺", NL: "🇳🇱", FR: "🇫🇷", TR: "🇹🇷",
};

const COUNTRY_NAME_MAP: Record<string, string> = {
  US: "ABD", DE: "Almanya", GB: "İngiltere", CA: "Kanada",
  AU: "Avustralya", NL: "Hollanda", FR: "Fransa", TR: "Türkiye",
};

function computeStepStates(steps: Step[], completedMap: Map<string, Progress>): StepState[] {
  let foundFirstIncomplete = false;
  let disqualified = false;

  return steps.map((step) => {
    if (disqualified) return "disqualified";

    const prog = completedMap.get(step.id);
    const done = !!prog;

    if (done) {
      if (
        step.blockingAnswer &&
        prog.answer.trim().toLowerCase() === step.blockingAnswer.trim().toLowerCase()
      ) {
        disqualified = true;
      }
      return "completed";
    }

    if (!foundFirstIncomplete) {
      foundFirstIncomplete = true;
      return "active";
    }

    return "locked";
  });
}

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
  const stepStates = computeStepStates(steps, completedMap);
  const completionPct =
    steps.length > 0
      ? Math.round((completedMap.size / steps.length) * 100)
      : 0;

  const openStep = (step: Step, state: StepState) => {
    if (state === "locked") {
      Alert.alert(
        "Adım Kilitli",
        "Bu adıma geçebilmek için önceki adımı tamamlaman gerekiyor.",
        [{ text: "Anladım" }]
      );
      return;
    }
    if (state === "disqualified") {
      return;
    }
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
          <ActivityIndicator color={Colors.primary} />
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
            const state = stepStates[index] ?? "locked";
            const completedProgress = completedMap.get(item.id);
            return (
              <StepRow
                step={item}
                index={index}
                state={state}
                completedProgress={completedProgress}
                onPress={() => openStep(item, state)}
              />
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
                <Ionicons name="close" size={24} color={Colors.textSecondary} />
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
              placeholderTextColor={Colors.textMuted}
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
                  <ActivityIndicator color={Colors.surface} size="small" />
                ) : (
                  <>
                    <Ionicons name="checkmark" size={18} color={Colors.surface} />
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

// ─── StepRow ─────────────────────────────────────────────────────────────────

function StepRow({
  step,
  index,
  state,
  completedProgress,
  onPress,
}: {
  step: Step;
  index: number;
  state: StepState;
  completedProgress?: Progress;
  onPress: () => void;
}) {
  const isInteractive = state === "completed" || state === "active";

  return (
    <TouchableOpacity
      style={[styles.stepRow, stepRowVariant[state]]}
      onPress={onPress}
      activeOpacity={isInteractive ? 0.7 : 1}
    >
      {/* Step dot / icon */}
      <StepDot state={state} index={index} />

      {/* Content */}
      <View style={styles.stepContent}>
        <Text style={[styles.stepQuestion, stepQuestionVariant[state]]}>
          {step.question}
        </Text>

        {step.description && state !== "disqualified" && (
          <Text style={styles.stepDesc}>{step.description}</Text>
        )}

        {/* Completed: show saved answer */}
        {state === "completed" && completedProgress && (
          <View style={styles.answerBox}>
            <MaterialCommunityIcons
              name="comment-check-outline"
              size={14}
              color={Colors.secondary}
            />
            <Text style={styles.answerText} numberOfLines={2}>
              {completedProgress.answer}
            </Text>
          </View>
        )}

        {/* Disqualified: blocking warning */}
        {state === "disqualified" && (
          <View style={styles.disqualifiedBox}>
            <Ionicons name="alert-circle" size={14} color={Colors.warning} />
            <Text style={styles.disqualifiedText}>
              Bu kriteri sağlamadan devam edemezsin.
            </Text>
          </View>
        )}

        {/* Locked: hint */}
        {state === "locked" && (
          <Text style={styles.lockedHint}>Önceki adımı tamamla</Text>
        )}
      </View>

      {/* Right icon */}
      {state === "completed" && (
        <Ionicons name="pencil-outline" size={18} color={Colors.secondary} style={styles.stepArrow} />
      )}
      {state === "active" && (
        <Ionicons name="chevron-forward" size={18} color={Colors.primary} style={styles.stepArrow} />
      )}
      {state === "locked" && (
        <Ionicons name="lock-closed-outline" size={16} color={Colors.textMuted} style={styles.stepArrow} />
      )}
      {state === "disqualified" && (
        <Ionicons name="ban-outline" size={16} color={Colors.warning} style={styles.stepArrow} />
      )}
    </TouchableOpacity>
  );
}

function StepDot({ state, index }: { state: StepState; index: number }) {
  const dotStyle = [styles.stepDot, stepDotVariant[state]];

  if (state === "completed") {
    return (
      <View style={dotStyle}>
        <Ionicons name="checkmark" size={16} color={Colors.surface} />
      </View>
    );
  }
  if (state === "active") {
    return (
      <View style={dotStyle}>
        <Text style={styles.stepNum}>{String(index + 1)}</Text>
      </View>
    );
  }
  if (state === "locked") {
    return (
      <View style={dotStyle}>
        <Ionicons name="lock-closed" size={13} color={Colors.textMuted} />
      </View>
    );
  }
  // disqualified
  return (
    <View style={dotStyle}>
      <Ionicons name="alert" size={13} color={Colors.warning} />
    </View>
  );
}

// ─── State-dependent style maps ───────────────────────────────────────────────

const stepRowVariant: Record<StepState, object> = {
  completed:    { backgroundColor: "#F0FDF4", borderColor: "#BBF7D0" },
  active:       { backgroundColor: Colors.surface, borderColor: Colors.primary, borderWidth: 1.5 },
  locked:       { backgroundColor: "#FAFAFA", borderColor: Colors.border, opacity: 0.7 },
  disqualified: { backgroundColor: Colors.warningLight, borderColor: "#FDE68A" },
};

const stepDotVariant: Record<StepState, object> = {
  completed:    { backgroundColor: Colors.secondary, borderColor: Colors.secondary },
  active:       { borderColor: Colors.primary, borderWidth: 2 },
  locked:       { borderColor: Colors.textMuted, borderWidth: 1.5, backgroundColor: "#F3F4F6" },
  disqualified: { borderColor: Colors.warning, borderWidth: 1.5, backgroundColor: Colors.warningLight },
};

const stepQuestionVariant: Record<StepState, object> = {
  completed:    { color: "#065F46" },
  active:       { color: Colors.textPrimary },
  locked:       { color: Colors.textMuted },
  disqualified: { color: Colors.warning },
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  title: {
    ...Typography.h1,
    color: Colors.textPrimary,
    paddingHorizontal: Spacing.md,
    paddingTop: 56,
    paddingBottom: 12,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.lg,
  },
  countryList: {
    paddingHorizontal: Spacing.md,
    paddingBottom: 12,
    gap: Spacing.sm,
  },
  countryChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.borderStrong,
    borderRadius: Radius.full,
    paddingHorizontal: 14,
    paddingVertical: Spacing.sm,
    gap: 6,
    minHeight: MinTapTarget,
  },
  countryChipSelected: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
  },
  countryFlag: {
    fontSize: 18,
  },
  countryChipText: {
    ...Typography.label,
    color: Colors.textSecondary,
  },
  countryChipTextSelected: {
    color: Colors.primary,
  },
  progressContainer: {
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.md,
  },
  progressLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginBottom: 6,
  },
  progressTrack: {
    height: 8,
    backgroundColor: Colors.border,
    borderRadius: Radius.full,
    overflow: "hidden",
  },
  progressFill: {
    height: 8,
    backgroundColor: Colors.secondary,
    borderRadius: Radius.full,
  },
  stepList: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    borderRadius: Radius.md,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 10,
  },
  stepArrow: {
    alignSelf: "center",
  },
  stepDot: {
    width: 32,
    height: 32,
    borderRadius: Radius.full,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderWidth: 2,
    borderColor: Colors.border,
    flexShrink: 0,
  },
  stepNum: {
    ...Typography.caption,
    fontWeight: "600",
    color: Colors.primary,
  },
  stepContent: {
    flex: 1,
    paddingTop: 4,
  },
  stepQuestion: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  stepDesc: {
    ...Typography.caption,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  answerBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: Radius.sm,
    marginTop: 6,
    gap: 6,
    borderWidth: 1,
    borderColor: "#D1FAE5",
  },
  answerText: {
    ...Typography.small,
    color: "#065F46",
    flex: 1,
  },
  disqualifiedBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 6,
  },
  disqualifiedText: {
    ...Typography.caption,
    color: Colors.warning,
    flex: 1,
    lineHeight: 18,
  },
  lockedHint: {
    ...Typography.small,
    color: Colors.textMuted,
    marginTop: 4,
  },
  errorText: {
    color: Colors.danger,
    fontSize: 15,
  },
  emptyText: {
    color: Colors.textSecondary,
    fontSize: 15,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: Radius.lg,
    borderTopRightRadius: Radius.lg,
    padding: 20,
    paddingBottom: 32,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.sm,
  },
  modalLabel: {
    ...Typography.small,
    fontWeight: "600",
    color: Colors.primary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  modalClose: {
    padding: 4,
    minWidth: MinTapTarget,
    minHeight: MinTapTarget,
    justifyContent: "center",
    alignItems: "flex-end",
  },
  modalQuestion: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  modalDesc: {
    ...Typography.caption,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginBottom: Spacing.md,
  },
  modalInputLabel: {
    ...Typography.caption,
    fontWeight: "500",
    color: "#374151",
    marginBottom: 6,
  },
  modalInput: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.borderStrong,
    borderRadius: Radius.md,
    padding: 12,
    fontSize: 15,
    color: Colors.textPrimary,
    minHeight: 100,
    textAlignVertical: "top",
    marginBottom: Spacing.md,
  },
  modalActions: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  modalCancel: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: Radius.md,
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    minHeight: MinTapTarget,
    justifyContent: "center",
  },
  modalCancelText: {
    color: Colors.textSecondary,
    fontWeight: "600",
    fontSize: 15,
  },
  modalSave: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: Radius.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.primary,
    gap: 6,
    minHeight: MinTapTarget,
  },
  modalSaveText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 15,
  },
});
