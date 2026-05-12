import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Linking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../services/api";
import { Colors, Typography, Spacing, Radius, MinTapTarget } from "../../theme";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Step {
  id: string;
  order: number;
  question: string;
  description?: string;
  blockingAnswer?: string;
  options?: string[];
  faqUrl?: string;
  stepType?: "checklist" | "assessment";
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

type ActiveTab = "assessment" | "checklist";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const FLAG_MAP: Record<string, string> = {
  US: "🇺🇸", DE: "🇩🇪", GB: "🇬🇧", CA: "🇨🇦",
  AU: "🇦🇺", NL: "🇳🇱", FR: "🇫🇷", TR: "🇹🇷",
};

const COUNTRY_NAME_MAP: Record<string, string> = {
  US: "ABD", DE: "Almanya", GB: "İngiltere", CA: "Kanada",
  AU: "Avustralya", NL: "Hollanda", FR: "Fransa", TR: "Türkiye",
};

function isBlockingAnswer(step: Step, answer: string): boolean {
  return !!(
    step.blockingAnswer &&
    answer.trim().toLowerCase() === step.blockingAnswer.trim().toLowerCase()
  );
}

/**
 * Returns how far the step-by-step reveal should go.
 * Assessment tab: never blocks, just stops at first unanswered.
 * Checklist tab: stops at first blocking answer.
 */
function computeVisible(
  steps: Step[],
  completedMap: Map<string, Progress>,
  tab: ActiveTab
): { visibleUpTo: number; blocked: boolean } {
  for (let i = 0; i < steps.length; i++) {
    const prog = completedMap.get(steps[i].id);
    if (!prog) return { visibleUpTo: i, blocked: false };
    if (tab === "checklist" && isBlockingAnswer(steps[i], prog.answer)) {
      return { visibleUpTo: i, blocked: true };
    }
  }
  return { visibleUpTo: steps.length - 1, blocked: false };
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export function GuideScreen() {
  const { token } = useAuth();
  const [countries, setCountries] = useState<Country[]>([]);
  const [selectedCountryId, setSelectedCountryId] = useState<string>("");
  const [steps, setSteps] = useState<Step[]>([]);
  const [progress, setProgress] = useState<Progress[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>("assessment");
  const scrollRef = useRef<ScrollView>(null);

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

  const loadData = async () => {
    if (!token || !selectedCountryId) return;
    const [s, p] = await Promise.all([
      api.guide.getSteps(selectedCountryId, token),
      api.guide.getProgress(token),
    ]);
    setSteps(s);
    setProgress(p);
  };

  useEffect(() => {
    if (!token || !selectedCountryId) return;
    setLoading(true);
    setError(null);
    loadData()
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "Yüklenemedi."))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, selectedCountryId]);

  const handleAnswer = async (step: Step, answer: string) => {
    if (!token || saving) return;
    setSaving(step.id);
    try {
      await api.guide.saveProgress(step.id, answer, token);
      await loadData();
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 150);
    } finally {
      setSaving(null);
    }
  };

  const completedMap = new Map(progress.map((p) => [p.stepId, p]));

  const assessmentSteps = steps.filter((s) => (s.stepType ?? "checklist") === "assessment");
  const checklistSteps = steps.filter((s) => (s.stepType ?? "checklist") === "checklist");

  // Progress = only non-blocking completed checklist steps
  const nonBlockingDone = checklistSteps.filter((s) => {
    const prog = completedMap.get(s.id);
    return prog && !isBlockingAnswer(s, prog.answer);
  }).length;
  const totalChecklist = checklistSteps.length;
  const pct = totalChecklist > 0 ? Math.round((nonBlockingDone / totalChecklist) * 100) : 0;

  const activeSteps = activeTab === "assessment" ? assessmentSteps : checklistSteps;
  const { visibleUpTo, blocked } = computeVisible(activeSteps, completedMap, activeTab);
  const allDone =
    activeSteps.length > 0 &&
    !blocked &&
    activeSteps.every((s) => completedMap.has(s.id));

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Rehberim</Text>
        {activeTab === "checklist" && totalChecklist > 0 && (
          <View style={styles.progressPill}>
            <Text style={styles.progressPillText}>
              {nonBlockingDone}/{totalChecklist} · %{pct}
            </Text>
          </View>
        )}
      </View>

      {/* Country chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.countryList}
      >
        {countries.map((c) => (
          <TouchableOpacity
            key={c.id}
            style={[
              styles.countryChip,
              selectedCountryId === c.id && styles.countryChipSelected,
            ]}
            onPress={() => setSelectedCountryId(c.id)}
            activeOpacity={0.7}
          >
            <Text style={styles.countryFlag}>{FLAG_MAP[c.code] ?? "🌍"}</Text>
            <Text
              style={[
                styles.countryChipText,
                selectedCountryId === c.id && styles.countryChipTextSelected,
              ]}
            >
              {COUNTRY_NAME_MAP[c.code] ?? c.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Tabs */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === "assessment" && styles.tabBtnActive]}
          onPress={() => setActiveTab("assessment")}
          activeOpacity={0.7}
        >
          <Ionicons
            name="clipboard-outline"
            size={15}
            color={activeTab === "assessment" ? Colors.primary : Colors.textSecondary}
          />
          <Text
            style={[
              styles.tabBtnText,
              activeTab === "assessment" && styles.tabBtnTextActive,
            ]}
          >
            Değerlendirme
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === "checklist" && styles.tabBtnActive]}
          onPress={() => setActiveTab("checklist")}
          activeOpacity={0.7}
        >
          <Ionicons
            name="checkmark-done-outline"
            size={15}
            color={activeTab === "checklist" ? Colors.primary : Colors.textSecondary}
          />
          <Text
            style={[
              styles.tabBtnText,
              activeTab === "checklist" && styles.tabBtnTextActive,
            ]}
          >
            Kontrol Listesi
          </Text>
          {totalChecklist > 0 && (
            <View style={[
              styles.tabBadge,
              activeTab === "checklist" && styles.tabBadgeActive,
            ]}>
              <Text style={[
                styles.tabBadgeText,
                activeTab === "checklist" && styles.tabBadgeTextActive,
              ]}>
                %{pct}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Checklist: progress bar */}
      {activeTab === "checklist" && totalChecklist > 0 && (
        <View style={styles.progressBarWrap}>
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                { width: `${pct}%` as `${number}%` },
                blocked && styles.progressFillBlocked,
              ]}
            />
          </View>
        </View>
      )}

      {/* Content */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.primary} />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : activeSteps.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="document-text-outline" size={44} color={Colors.textMuted} />
          <Text style={styles.emptyText}>
            {activeTab === "assessment"
              ? "Bu ülke için değerlendirme sorusu yok."
              : "Bu ülke için kontrol listesi yok."}
          </Text>
        </View>
      ) : (
        <ScrollView
          ref={scrollRef}
          style={styles.scroll}
          contentContainerStyle={styles.stepList}
          showsVerticalScrollIndicator={false}
        >
          {/* Tab description */}
          <View style={styles.tabDesc}>
            {activeTab === "assessment" ? (
              <>
                <Ionicons name="information-circle-outline" size={15} color={Colors.textSecondary} />
                <Text style={styles.tabDescText}>
                  Bu sorular vize sürecinizi kişiselleştirmek için kullanılır.
                </Text>
              </>
            ) : (
              <>
                <Ionicons name="information-circle-outline" size={15} color={Colors.textSecondary} />
                <Text style={styles.tabDescText}>
                  Her adımı tamamladıkça ilerlemeniz kaydedilir.
                </Text>
              </>
            )}
          </View>

          {activeSteps.slice(0, visibleUpTo + 1).map((step, idx) => {
            const prog = completedMap.get(step.id);
            if (prog) {
              return (
                <CompletedCard
                  key={step.id}
                  step={step}
                  index={idx}
                  answer={prog.answer}
                  tab={activeTab}
                />
              );
            }
            return (
              <ActiveStepCard
                key={step.id}
                step={step}
                index={idx}
                total={activeSteps.length}
                saving={saving === step.id}
                tab={activeTab}
                onAnswer={(ans) => handleAnswer(step, ans)}
              />
            );
          })}

          {blocked && <BlockerCard step={activeSteps[visibleUpTo]} />}

          {allDone && (
            <View style={styles.doneCard}>
              <Ionicons
                name="checkmark-circle"
                size={56}
                color={activeTab === "assessment" ? Colors.primary : Colors.secondary}
              />
              <Text style={[
                styles.doneTitle,
                activeTab === "assessment" && { color: Colors.primary },
              ]}>
                {activeTab === "assessment" ? "Profil Tamamlandı!" : "Tebrikler!"}
              </Text>
              <Text style={styles.doneSub}>
                {activeTab === "assessment"
                  ? "Değerlendirme sorularını yanıtladınız."
                  : "Tüm kontrol listesini tamamladınız."}
              </Text>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

// ─── CompletedCard ────────────────────────────────────────────────────────────

function CompletedCard({
  step,
  index,
  answer,
  tab,
}: {
  step: Step;
  index: number;
  answer: string;
  tab: ActiveTab;
}) {
  const blocking = tab === "checklist" && isBlockingAnswer(step, answer);
  return (
    <View style={[styles.completedCard, blocking && styles.completedCardWarn]}>
      <View style={[styles.badge, blocking ? styles.badgeWarn : styles.badgeDone]}>
        {blocking ? (
          <Ionicons name="alert" size={12} color={Colors.warning} />
        ) : (
          <Ionicons name="checkmark" size={13} color="#fff" />
        )}
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.completedQuestion} numberOfLines={2}>
          {step.question}
        </Text>
        <View style={[styles.answerChip, blocking && styles.answerChipWarn]}>
          <Text
            style={[styles.answerChipText, blocking && styles.answerChipTextWarn]}
            numberOfLines={1}
          >
            {answer}
          </Text>
        </View>
      </View>
      <Text style={styles.stepNumSmall}>{index + 1}</Text>
    </View>
  );
}

// ─── ActiveStepCard ───────────────────────────────────────────────────────────

function ActiveStepCard({
  step,
  index,
  total,
  saving,
  tab,
  onAnswer,
}: {
  step: Step;
  index: number;
  total: number;
  saving: boolean;
  tab: ActiveTab;
  onAnswer: (answer: string) => void;
}) {
  const [tapped, setTapped] = useState<string | null>(null);
  const options = step.options ?? [];

  const handleTap = (opt: string) => {
    if (saving) return;
    setTapped(opt);
    onAnswer(opt);
  };

  const isAssessment = tab === "assessment";
  const accentColor = isAssessment ? Colors.primary : Colors.primary;
  const twoCol = options.length === 2;

  return (
    <View style={[styles.activeCard, isAssessment && styles.activeCardAssessment]}>
      {/* Meta */}
      <View style={styles.activeMeta}>
        <View style={[styles.badge, isAssessment ? styles.badgeAssessment : undefined]}>
          <Text style={styles.badgeNum}>{index + 1}</Text>
        </View>
        <Text style={[styles.activeMetaText, isAssessment && styles.activeMetaTextAssessment]}>
          {isAssessment ? "Değerlendirme" : "Adım"} {index + 1} / {total}
        </Text>
      </View>

      {/* Question */}
      <Text style={styles.activeQuestion}>{step.question}</Text>
      {!!step.description && (
        <Text style={styles.activeDesc}>{step.description}</Text>
      )}

      {/* Options */}
      {options.length === 0 ? (
        <View style={styles.noOptionsWrap}>
          <Ionicons name="warning-outline" size={16} color={Colors.textMuted} />
          <Text style={styles.noOptionsText}>
            Bu adım için seçenekler henüz tanımlanmamış.
          </Text>
        </View>
      ) : (
        <View style={[styles.optionsCol, twoCol && styles.optionsRow]}>
          {options.map((opt) => {
            const isSelected = tapped === opt;
            const isLoading = isSelected && saving;
            const isBlocking = !isAssessment &&
              step.blockingAnswer &&
              opt.trim().toLowerCase() === step.blockingAnswer.trim().toLowerCase();

            return (
              <TouchableOpacity
                key={opt}
                style={[
                  styles.optionBtn,
                  twoCol && styles.optionBtnHalf,
                  isSelected && (isBlocking ? styles.optionBtnWarn : styles.optionBtnSelected),
                  saving && !isSelected && styles.optionBtnDimmed,
                ]}
                onPress={() => handleTap(opt)}
                activeOpacity={0.75}
                disabled={saving}
              >
                {isLoading ? (
                  <ActivityIndicator
                    size="small"
                    color={isBlocking ? Colors.warning : Colors.surface}
                  />
                ) : (
                  <Text
                    style={[
                      styles.optionBtnText,
                      isSelected && !isBlocking && styles.optionBtnTextSelected,
                      isSelected && isBlocking && styles.optionBtnTextWarn,
                    ]}
                  >
                    {opt}
                  </Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );
}

// ─── BlockerCard ──────────────────────────────────────────────────────────────

function BlockerCard({ step }: { step: Step }) {
  return (
    <View style={styles.blockerCard}>
      <View style={styles.blockerIconWrap}>
        <Ionicons name="alert-circle" size={22} color={Colors.warning} />
      </View>
      <View style={styles.blockerBody}>
        <Text style={styles.blockerTitle}>Bu adımda durmanız gerekiyor</Text>
        <Text style={styles.blockerText}>
          {step.description ??
            "Bu soruya verdiğiniz yanıt nedeniyle sürece şu an devam edilemiyor. Önce bu kriteri karşılamanız gerekiyor."}
        </Text>
        {!!step.faqUrl && (
          <TouchableOpacity
            style={styles.blockerLink}
            onPress={() => Linking.openURL(step.faqUrl!)}
            activeOpacity={0.7}
          >
            <Text style={styles.blockerLinkText}>Daha fazla bilgi al</Text>
            <Ionicons name="open-outline" size={13} color={Colors.primary} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    paddingTop: 56,
    paddingBottom: 12,
  },
  title: {
    ...Typography.h1,
    color: Colors.textPrimary,
  },
  progressPill: {
    backgroundColor: Colors.primaryLight,
    borderRadius: Radius.full,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  progressPillText: {
    ...Typography.small,
    fontWeight: "600",
    color: Colors.primary,
  },

  // Country chips
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
  countryFlag: { fontSize: 18 },
  countryChipText: {
    ...Typography.label,
    color: Colors.textSecondary,
  },
  countryChipTextSelected: { color: Colors.primary },

  // Tabs
  tabBar: {
    flexDirection: "row",
    marginHorizontal: Spacing.md,
    marginBottom: 8,
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 3,
    gap: 3,
  },
  tabBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: Radius.sm,
    gap: 5,
  },
  tabBtnActive: {
    backgroundColor: Colors.primaryLight,
  },
  tabBtnText: {
    ...Typography.label,
    color: Colors.textSecondary,
  },
  tabBtnTextActive: {
    color: Colors.primary,
    fontWeight: "600",
  },
  tabBadge: {
    backgroundColor: Colors.border,
    borderRadius: Radius.full,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  tabBadgeActive: {
    backgroundColor: Colors.primary,
  },
  tabBadgeText: {
    ...Typography.small,
    fontWeight: "700",
    color: Colors.textSecondary,
  },
  tabBadgeTextActive: {
    color: "#fff",
  },

  // Progress bar
  progressBarWrap: {
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
  },
  progressTrack: {
    height: 6,
    backgroundColor: Colors.border,
    borderRadius: Radius.full,
    overflow: "hidden",
  },
  progressFill: {
    height: 6,
    backgroundColor: Colors.secondary,
    borderRadius: Radius.full,
  },
  progressFillBlocked: {
    backgroundColor: Colors.warning,
  },

  // Layout
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: Spacing.sm,
    padding: Spacing.lg,
  },
  errorText: { color: Colors.danger, fontSize: 15 },
  emptyText: {
    color: Colors.textSecondary,
    fontSize: 15,
    textAlign: "center",
    marginTop: 8,
  },
  scroll: { flex: 1 },
  stepList: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.xl,
    gap: Spacing.sm,
  },

  // Tab description
  tabDesc: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
    paddingVertical: 6,
  },
  tabDescText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    flex: 1,
    lineHeight: 18,
  },

  // Badge
  badge: {
    width: 26,
    height: 26,
    borderRadius: Radius.full,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  badgeDone: { backgroundColor: Colors.secondary },
  badgeWarn: {
    backgroundColor: Colors.warningLight,
    borderWidth: 1.5,
    borderColor: Colors.warning,
  },
  badgeAssessment: { backgroundColor: "#7C3AED" },
  badgeNum: {
    ...Typography.small,
    fontWeight: "700",
    color: "#fff",
  },

  // Completed card
  completedCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.secondaryLight,
    borderWidth: 1,
    borderColor: "#BBF7D0",
    borderRadius: Radius.md,
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 10,
  },
  completedCardWarn: {
    backgroundColor: Colors.warningLight,
    borderColor: "#FDE68A",
  },
  cardBody: {
    flex: 1,
    gap: 5,
  },
  completedQuestion: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  answerChip: {
    alignSelf: "flex-start",
    backgroundColor: "#D1FAE5",
    borderRadius: Radius.full,
    paddingHorizontal: 10,
    paddingVertical: 3,
    maxWidth: "90%",
  },
  answerChipWarn: { backgroundColor: "#FEF3C7" },
  answerChipText: {
    ...Typography.small,
    fontWeight: "600",
    color: "#065F46",
  },
  answerChipTextWarn: { color: "#92400E" },
  stepNumSmall: {
    ...Typography.small,
    color: Colors.textMuted,
    minWidth: 16,
    textAlign: "right",
  },

  // Active card
  activeCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 2,
    borderColor: Colors.primary,
    padding: Spacing.md,
    gap: Spacing.sm,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  activeCardAssessment: {
    borderColor: "#7C3AED",
    shadowColor: "#7C3AED",
  },
  activeMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  activeMetaText: {
    ...Typography.small,
    fontWeight: "600",
    color: Colors.primary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  activeMetaTextAssessment: {
    color: "#7C3AED",
  },
  activeQuestion: {
    fontSize: 17,
    fontWeight: "700",
    color: Colors.textPrimary,
    lineHeight: 24,
  },
  activeDesc: {
    ...Typography.caption,
    color: Colors.textSecondary,
    lineHeight: 18,
  },

  // Options
  optionsCol: {
    flexDirection: "column",
    gap: Spacing.sm,
    marginTop: 4,
  },
  optionsRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginTop: 4,
  },
  optionBtn: {
    paddingVertical: 13,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: Colors.borderStrong,
    backgroundColor: Colors.background,
    minHeight: MinTapTarget,
  },
  optionBtnHalf: { flex: 1 },
  optionBtnSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  optionBtnWarn: {
    backgroundColor: Colors.warningLight,
    borderColor: Colors.warning,
  },
  optionBtnDimmed: { opacity: 0.4 },
  optionBtnText: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.textPrimary,
    textAlign: "center",
  },
  optionBtnTextSelected: { color: Colors.surface },
  optionBtnTextWarn: { color: "#92400E" },

  noOptionsWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
  },
  noOptionsText: {
    ...Typography.caption,
    color: Colors.textMuted,
    flex: 1,
  },

  // Blocker card
  blockerCard: {
    flexDirection: "row",
    backgroundColor: Colors.warningLight,
    borderWidth: 1.5,
    borderColor: "#FDE68A",
    borderRadius: Radius.lg,
    padding: Spacing.md,
    gap: 12,
    marginTop: 4,
  },
  blockerIconWrap: { paddingTop: 2, flexShrink: 0 },
  blockerBody: { flex: 1, gap: 6 },
  blockerTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#92400E",
  },
  blockerText: {
    ...Typography.caption,
    color: "#78350F",
    lineHeight: 19,
  },
  blockerLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  blockerLinkText: {
    ...Typography.caption,
    fontWeight: "600",
    color: Colors.primary,
  },

  // Done card
  doneCard: {
    alignItems: "center",
    paddingVertical: Spacing.xl,
    gap: Spacing.sm,
  },
  doneTitle: {
    ...Typography.h2,
    color: Colors.secondary,
  },
  doneSub: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: "center",
  },
});
