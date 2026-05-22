import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
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
  isGlobal?: boolean;
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

// ─── Constants ────────────────────────────────────────────────────────────────

const FLAG_MAP: Record<string, string> = {
  US: "🇺🇸", DE: "🇩🇪", GB: "🇬🇧", CA: "🇨🇦",
  AU: "🇦🇺", NL: "🇳🇱", FR: "🇫🇷", TR: "🇹🇷",
};

const COUNTRY_NAME_MAP: Record<string, string> = {
  US: "ABD", DE: "Almanya", GB: "İngiltere", CA: "Kanada",
  AU: "Avustralya", NL: "Hollanda", FR: "Fransa", TR: "Türkiye",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isBlockingAnswer(step: Step, answer: string): boolean {
  return !!(
    step.blockingAnswer &&
    answer.trim().toLowerCase() === step.blockingAnswer.trim().toLowerCase()
  );
}

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

  // Ülke listesi
  const [countries, setCountries] = useState<Country[]>([]);
  // Şu an gözetlenen ülke (chip tıklamasıyla değişir)
  const [viewCountryId, setViewCountryId] = useState<string>("");
  // Aktif progression ülkesi (user profili)
  const [activeCountryId, setActiveCountryId] = useState<string | null>(null);

  const [steps, setSteps] = useState<Step[]>([]);
  const [progress, setProgress] = useState<Progress[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const [editingStepId, setEditingStepId] = useState<string | null>(null);
  const [settingActive, setSettingActive] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>("assessment");
  const [countrySearch, setCountrySearch] = useState("");
  const scrollRef = useRef<ScrollView>(null);

  // ── Ülkeler + kullanıcı profili ──────────────────────────────────────────────
  useEffect(() => {
    if (!token) return;
    Promise.all([
      api.forum.getCountries(token),
      api.users.me(token),
    ]).then(([countriesData, meData]) => {
      // Sanal global ülkeyi chip listesinden çıkar
      const real = countriesData.filter((c) => c.code !== "XX");
      setCountries(real);
      const savedActive = meData.activeGuideCountryId ?? null;
      setActiveCountryId(savedActive);
      setViewCountryId(savedActive ?? (real[0]?.id ?? ""));
    }).catch((e: unknown) =>
      setError(e instanceof Error ? e.message : "Yüklenemedi.")
    );
  }, [token]);

  // ── Adımlar + ilerleme ───────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    if (!token || !viewCountryId) return;
    const [s, p] = await Promise.all([
      api.guide.getSteps(viewCountryId, token),
      api.guide.getProgress(token),
    ]);
    setSteps(s);
    setProgress(p);
  }, [token, viewCountryId]);

  useEffect(() => {
    if (!token || !viewCountryId) return;
    setLoading(true);
    setError(null);
    loadData()
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "Yüklenemedi."))
      .finally(() => setLoading(false));
  }, [token, viewCountryId, loadData]);

  // ── Aktif ülke değiştir ──────────────────────────────────────────────────────
  const handleSetActive = async () => {
    if (!token || settingActive || viewCountryId === activeCountryId) return;
    setSettingActive(true);
    try {
      await api.users.updateMe({ activeGuideCountryId: viewCountryId }, token);
      setActiveCountryId(viewCountryId);
    } finally {
      setSettingActive(false);
    }
  };

  // ── Cevap kaydet ─────────────────────────────────────────────────────────────
  const handleAnswer = async (step: Step, answer: string) => {
    if (!token || saving) return;
    setSaving(step.id);
    try {
      await api.guide.saveProgress(step.id, answer, viewCountryId, token);
      setEditingStepId(null);          // düzenleme modundan çık
      await loadData();
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 150);
    } finally {
      setSaving(null);
    }
  };

  // ── Hesaplamalar ─────────────────────────────────────────────────────────────
  const completedMap = new Map(progress.map((p) => [p.stepId, p]));
  const isViewingActive = viewCountryId === activeCountryId;

  const assessmentSteps = steps.filter((s) => (s.stepType ?? "checklist") === "assessment");
  const checklistSteps  = steps.filter((s) => (s.stepType ?? "checklist") === "checklist");

  // Progress: sadece aktif ülkeye ait, blocking olmayan tamamlananlar
  const nonBlockingDone = isViewingActive
    ? checklistSteps.filter((s) => {
        const p = completedMap.get(s.id);
        return p && !isBlockingAnswer(s, p.answer);
      }).length
    : checklistSteps.filter((s) => {
        const p = completedMap.get(s.id);
        return p && !isBlockingAnswer(s, p.answer);
      }).length; // gözetleme modunda yine sayalım ama progress bar grileşir

  const totalChecklist = checklistSteps.length;
  const pct = totalChecklist > 0 ? Math.round((nonBlockingDone / totalChecklist) * 100) : 0;

  const activeSteps = activeTab === "assessment" ? assessmentSteps : checklistSteps;
  const { visibleUpTo, blocked } = computeVisible(activeSteps, completedMap, activeTab);
  const allDone =
    activeSteps.length > 0 &&
    !blocked &&
    activeSteps.every((s) => completedMap.has(s.id));

  // Global adım sayısı (bilgi etiketi)
  const globalCount = steps.filter((s) => s.isGlobal).length;

  const filteredCountries = countrySearch.trim()
    ? countries.filter((c) => {
        const q = countrySearch.trim().toLowerCase();
        const name = (COUNTRY_NAME_MAP[c.code] ?? c.name).toLowerCase();
        return name.includes(q) || c.code.toLowerCase().includes(q);
      })
    : countries;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Rehberim</Text>
        {activeTab === "checklist" && totalChecklist > 0 && (
          <View style={[styles.progressPill, !isViewingActive && styles.progressPillMuted]}>
            <Text style={[styles.progressPillText, !isViewingActive && styles.progressPillTextMuted]}>
              {nonBlockingDone}/{totalChecklist} · %{pct}
            </Text>
          </View>
        )}
      </View>

      {/* Country search + chips */}
      {countries.length > 4 && (
        <View style={styles.countrySearchBox}>
          <Ionicons name="search" size={16} color={Colors.textMuted} />
          <TextInput
            style={styles.countrySearchInput}
            placeholder="Ülke ara..."
            placeholderTextColor={Colors.textMuted}
            value={countrySearch}
            onChangeText={setCountrySearch}
            autoCorrect={false}
            autoCapitalize="none"
          />
          {countrySearch.length > 0 && (
            <TouchableOpacity onPress={() => setCountrySearch("")} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close-circle" size={16} color={Colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      )}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.countryScroll}
        contentContainerStyle={styles.countryList}
      >
        {filteredCountries.map((c) => {
          const isActive   = c.id === activeCountryId;
          const isViewing  = c.id === viewCountryId;
          return (
            <TouchableOpacity
              key={c.id}
              style={[
                styles.countryChip,
                isViewing  && styles.countryChipViewing,
                isActive   && styles.countryChipActive,
              ]}
              onPress={() => setViewCountryId(c.id)}
              activeOpacity={0.7}
            >
              {isActive && (
                <Ionicons name="pin" size={11} color={Colors.surface} style={styles.pinIcon} />
              )}
              <Text style={styles.countryFlag}>{FLAG_MAP[c.code] ?? "🌍"}</Text>
              <Text
                style={[
                  styles.countryChipText,
                  isViewing && styles.countryChipTextViewing,
                  isActive  && styles.countryChipTextActive,
                ]}
              >
                {COUNTRY_NAME_MAP[c.code] ?? c.name}
              </Text>
            </TouchableOpacity>
          );
        })}
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
          <Text style={[styles.tabBtnText, activeTab === "assessment" && styles.tabBtnTextActive]}>
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
          <Text style={[styles.tabBtnText, activeTab === "checklist" && styles.tabBtnTextActive]}>
            Kontrol Listesi
          </Text>
          {totalChecklist > 0 && (
            <View style={[styles.tabBadge, activeTab === "checklist" && styles.tabBadgeActive]}>
              <Text style={[styles.tabBadgeText, activeTab === "checklist" && styles.tabBadgeTextActive]}>
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
                !isViewingActive && styles.progressFillMuted,
                blocked && styles.progressFillBlocked,
                { width: `${pct}%` as `${number}%` },
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
          {/* Aktif olmayan ülke banner */}
          {activeTab === "checklist" && !isViewingActive && (
            <View style={styles.inactiveBanner}>
              <View style={styles.inactiveBannerLeft}>
                <Ionicons name="eye-outline" size={15} color={Colors.textSecondary} />
                <Text style={styles.inactiveBannerText}>
                  Sadece gözetliyorsunuz — ilerleme bu ülke için kaydedilmez.
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.activateBtn, settingActive && { opacity: 0.6 }]}
                onPress={handleSetActive}
                disabled={settingActive}
                activeOpacity={0.75}
              >
                {settingActive ? (
                  <ActivityIndicator size="small" color={Colors.surface} />
                ) : (
                  <>
                    <Ionicons name="pin" size={13} color={Colors.surface} />
                    <Text style={styles.activateBtnText}>Aktif Et</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* Aktif ülke etiketi */}
          {activeTab === "checklist" && isViewingActive && activeCountryId && (
            <View style={styles.activeBanner}>
              <Ionicons name="pin" size={13} color={Colors.primary} />
              <Text style={styles.activeBannerText}>
                Aktif rehber — ilerleme burada kaydedilir
              </Text>
            </View>
          )}

          {/* Global adım bilgisi */}
          {globalCount > 0 && (
            <View style={styles.globalBadgeRow}>
              <View style={styles.globalBadge}>
                <Ionicons name="globe-outline" size={11} color="#7C3AED" />
                <Text style={styles.globalBadgeText}>
                  {globalCount} ortak adım tüm ülkelere uygulanır
                </Text>
              </View>
            </View>
          )}

          {/* Tab açıklama satırı */}
          <View style={styles.tabDesc}>
            <Ionicons name="information-circle-outline" size={14} color={Colors.textMuted} />
            <Text style={styles.tabDescText}>
              {activeTab === "assessment"
                ? "Bu sorular vize sürecinizi kişiselleştirmek için kullanılır."
                : "Her adımı tamamladıkça ilerlemeniz kaydedilir."}
            </Text>
          </View>

          {/* Steps */}
          {activeSteps.slice(0, visibleUpTo + 1).map((step, idx) => {
            const prog = completedMap.get(step.id);
            const isEditing = editingStepId === step.id;

            // Tamamlanmış ama düzenleme modunda → cevap kartı gibi göster
            if (prog && isEditing) {
              return (
                <ActiveStepCard
                  key={step.id}
                  step={step}
                  index={idx}
                  total={activeSteps.length}
                  saving={saving === step.id}
                  tab={activeTab}
                  readonly={false}
                  editMode
                  previousAnswer={prog.answer}
                  onCancel={() => setEditingStepId(null)}
                  onAnswer={(ans) => handleAnswer(step, ans)}
                />
              );
            }

            if (prog) {
              return (
                <CompletedCard
                  key={step.id}
                  step={step}
                  index={idx}
                  answer={prog.answer}
                  tab={activeTab}
                  onEdit={() => setEditingStepId(step.id)}
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
                readonly={activeTab === "checklist" && !isViewingActive}
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
                color={activeTab === "assessment" ? "#7C3AED" : Colors.secondary}
              />
              <Text style={[styles.doneTitle, activeTab === "assessment" && { color: "#7C3AED" }]}>
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
  onEdit,
}: {
  step: Step;
  index: number;
  answer: string;
  tab: ActiveTab;
  onEdit: () => void;
}) {
  const blocking = tab === "checklist" && isBlockingAnswer(step, answer);
  return (
    <View style={[
      styles.completedCard,
      blocking && styles.completedCardWarn,
      step.isGlobal && styles.completedCardGlobal,
    ]}>
      <View style={[styles.badge, blocking ? styles.badgeWarn : styles.badgeDone]}>
        {blocking
          ? <Ionicons name="alert" size={12} color={Colors.warning} />
          : <Ionicons name="checkmark" size={13} color="#fff" />}
      </View>
      <View style={styles.cardBody}>
        <View style={styles.completedQuestionRow}>
          <Text style={styles.completedQuestion} numberOfLines={2}>
            {step.question}
          </Text>
          {step.isGlobal && (
            <View style={styles.globalTag}>
              <Ionicons name="globe-outline" size={10} color="#7C3AED" />
            </View>
          )}
        </View>
        <View style={[styles.answerChip, blocking && styles.answerChipWarn]}>
          <Text
            style={[styles.answerChipText, blocking && styles.answerChipTextWarn]}
            numberOfLines={1}
          >
            {answer}
          </Text>
        </View>
      </View>
      {/* Düzenle butonu */}
      <TouchableOpacity
        onPress={onEdit}
        style={styles.editBtn}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        activeOpacity={0.6}
      >
        <Ionicons name="pencil-outline" size={15} color={Colors.textMuted} />
      </TouchableOpacity>
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
  readonly,
  editMode = false,
  previousAnswer,
  onAnswer,
  onCancel,
}: {
  step: Step;
  index: number;
  total: number;
  saving: boolean;
  tab: ActiveTab;
  readonly: boolean;
  editMode?: boolean;
  previousAnswer?: string;
  onAnswer: (answer: string) => void;
  onCancel?: () => void;
}) {
  // Düzenleme modunda önceki cevabı seçili göster
  const [tapped, setTapped] = useState<string | null>(editMode && previousAnswer ? previousAnswer : null);
  const options = step.options ?? [];
  const isAssessment = tab === "assessment";

  const handleTap = (opt: string) => {
    if (saving || readonly) return;
    setTapped(opt);
    onAnswer(opt);
  };

  const twoCol = options.length === 2;

  return (
    <View style={[
      styles.activeCard,
      isAssessment && styles.activeCardAssessment,
      readonly && styles.activeCardReadonly,
      editMode && styles.activeCardEdit,
    ]}>
      {/* Meta */}
      <View style={styles.activeMeta}>
        <View style={[styles.badge, isAssessment ? styles.badgeAssessment : undefined]}>
          <Text style={styles.badgeNum}>{index + 1}</Text>
        </View>
        <Text style={[styles.activeMetaText, isAssessment && styles.activeMetaTextAssessment]}>
          {editMode ? "Güncelle" : (isAssessment ? "Değerlendirme" : "Adım")} {index + 1} / {total}
        </Text>
        {step.isGlobal && (
          <View style={styles.globalTagInline}>
            <Ionicons name="globe-outline" size={11} color="#7C3AED" />
            <Text style={styles.globalTagText}>Ortak</Text>
          </View>
        )}
        {/* Düzenleme modunda iptal butonu */}
        {editMode && onCancel && (
          <TouchableOpacity
            onPress={onCancel}
            style={styles.cancelEditBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            activeOpacity={0.6}
          >
            <Ionicons name="close" size={18} color={Colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      <Text style={styles.activeQuestion}>{step.question}</Text>
      {!!step.description && (
        <Text style={styles.activeDesc}>{step.description}</Text>
      )}

      {readonly ? (
        <View style={styles.readonlyNote}>
          <Ionicons name="lock-closed-outline" size={14} color={Colors.textMuted} />
          <Text style={styles.readonlyNoteText}>
            Bu ülkeyi aktif edin ve cevap verin.
          </Text>
        </View>
      ) : options.length === 0 ? (
        <View style={styles.noOptionsWrap}>
          <Ionicons name="warning-outline" size={15} color={Colors.textMuted} />
          <Text style={styles.noOptionsText}>Bu adım için seçenekler henüz tanımlanmamış.</Text>
        </View>
      ) : (
        <View style={[styles.optionsCol, twoCol && styles.optionsRow]}>
          {options.map((opt) => {
            const isSelected = tapped === opt;
            const isLoading  = isSelected && saving;
            const isBlock = !isAssessment &&
              step.blockingAnswer &&
              opt.trim().toLowerCase() === step.blockingAnswer.trim().toLowerCase();
            // Düzenleme modunda önceki cevap hafifçe vurgulanır
            const isPrevious = editMode && opt === previousAnswer && !isSelected;

            return (
              <TouchableOpacity
                key={opt}
                style={[
                  styles.optionBtn,
                  twoCol && styles.optionBtnHalf,
                  isPrevious && styles.optionBtnPrevious,
                  isSelected && (isBlock ? styles.optionBtnWarn : styles.optionBtnSelected),
                  saving && !isSelected && styles.optionBtnDimmed,
                ]}
                onPress={() => handleTap(opt)}
                activeOpacity={0.75}
                disabled={saving}
              >
                {isLoading ? (
                  <ActivityIndicator
                    size="small"
                    color={isBlock ? Colors.warning : Colors.surface}
                  />
                ) : (
                  <Text style={[
                    styles.optionBtnText,
                    isPrevious && styles.optionBtnTextPrevious,
                    isSelected && !isBlock && styles.optionBtnTextSelected,
                    isSelected && isBlock  && styles.optionBtnTextWarn,
                  ]}>
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
  container: { flex: 1, backgroundColor: Colors.background },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    paddingTop: 56,
    paddingBottom: 12,
  },
  title: { ...Typography.h1, color: Colors.textPrimary },
  progressPill: {
    backgroundColor: Colors.primaryLight,
    borderRadius: Radius.full,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  progressPillMuted: { backgroundColor: Colors.border },
  progressPillText: { ...Typography.small, fontWeight: "600", color: Colors.primary },
  progressPillTextMuted: { color: Colors.textMuted },

  // Country search
  countrySearchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.borderStrong,
    borderRadius: Radius.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginHorizontal: Spacing.md,
    marginBottom: 6,
    gap: Spacing.sm,
  },
  countrySearchInput: { flex: 1, fontSize: 14, color: Colors.textPrimary },

  // Country chips
  countryScroll: { flexGrow: 0, flexShrink: 0 },
  countryList: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    gap: Spacing.sm,
    alignItems: "center",
  },
  countryChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.borderStrong,
    borderRadius: Radius.md,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 5,
  },
  countryChipViewing: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
  },
  countryChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  pinIcon: { marginRight: 1 },
  countryFlag: { fontSize: 15 },
  countryChipText: { ...Typography.label, color: Colors.textSecondary },
  countryChipTextViewing: { color: Colors.primary },
  countryChipTextActive: { color: Colors.surface, fontWeight: "600" },

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
  tabBtnActive: { backgroundColor: Colors.primaryLight },
  tabBtnText: { ...Typography.label, color: Colors.textSecondary },
  tabBtnTextActive: { color: Colors.primary, fontWeight: "600" },
  tabBadge: {
    backgroundColor: Colors.border,
    borderRadius: Radius.full,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  tabBadgeActive: { backgroundColor: Colors.primary },
  tabBadgeText: { ...Typography.small, fontWeight: "700", color: Colors.textSecondary },
  tabBadgeTextActive: { color: "#fff" },

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
  progressFillMuted: { backgroundColor: Colors.textMuted },
  progressFillBlocked: { backgroundColor: Colors.warning },

  // Banners
  inactiveBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  inactiveBannerLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
  },
  inactiveBannerText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    flex: 1,
    lineHeight: 18,
  },
  activateBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.primary,
    borderRadius: Radius.sm,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 4,
    minHeight: 36,
  },
  activateBtnText: {
    ...Typography.small,
    fontWeight: "700",
    color: Colors.surface,
  },
  activeBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 4,
  },
  activeBannerText: {
    ...Typography.caption,
    fontWeight: "600",
    color: Colors.primary,
  },

  // Global badge
  globalBadgeRow: { flexDirection: "row", marginBottom: 2 },
  globalBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F3FF",
    borderRadius: Radius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
    gap: 4,
  },
  globalBadgeText: {
    ...Typography.small,
    color: "#7C3AED",
    fontWeight: "500",
  },

  // Tab description
  tabDesc: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 5,
    paddingVertical: 4,
  },
  tabDescText: {
    ...Typography.caption,
    color: Colors.textMuted,
    flex: 1,
    lineHeight: 17,
  },

  // Layout helpers
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: Spacing.sm,
    padding: Spacing.lg,
  },
  errorText: { color: Colors.danger, fontSize: 15 },
  emptyText: { color: Colors.textSecondary, fontSize: 15, textAlign: "center", marginTop: 8 },
  scroll: { flex: 1 },
  stepList: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.xl,
    gap: Spacing.sm,
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
  badgeNum: { ...Typography.small, fontWeight: "700", color: "#fff" },

  // Global tag
  globalTag: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#F5F3FF",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#DDD6FE",
    flexShrink: 0,
  },
  globalTagInline: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F3FF",
    borderRadius: Radius.full,
    paddingHorizontal: 7,
    paddingVertical: 2,
    gap: 3,
  },
  globalTagText: {
    ...Typography.small,
    color: "#7C3AED",
    fontWeight: "500",
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
  completedCardWarn: { backgroundColor: Colors.warningLight, borderColor: "#FDE68A" },
  completedCardGlobal: { borderLeftWidth: 3, borderLeftColor: "#7C3AED" },
  completedQuestionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  cardBody: { flex: 1 },
  completedQuestion: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.textSecondary,
    lineHeight: 18,
    flex: 1,
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
  answerChipText: { ...Typography.small, fontWeight: "600", color: "#065F46" },
  answerChipTextWarn: { color: "#92400E" },
  stepNumSmall: {
    ...Typography.small,
    color: Colors.textMuted,
    minWidth: 16,
    textAlign: "right",
  },
  editBtn: {
    padding: 6,
    borderRadius: Radius.sm,
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  cancelEditBtn: {
    marginLeft: "auto",
    padding: 4,
    borderRadius: Radius.sm,
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },

  // Active step card
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
  activeCardAssessment: { borderColor: "#7C3AED", shadowColor: "#7C3AED" },
  activeCardReadonly: {
    borderColor: Colors.borderStrong,
    shadowOpacity: 0,
    elevation: 0,
    opacity: 0.75,
  },
  activeCardEdit: {
    borderColor: "#F59E0B",
    shadowColor: "#F59E0B",
    shadowOpacity: 0.15,
  },
  activeMeta: { flexDirection: "row", alignItems: "center", gap: 8 },
  activeMetaText: {
    ...Typography.small,
    fontWeight: "600",
    color: Colors.primary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    flex: 1,
  },
  activeMetaTextAssessment: { color: "#7C3AED" },
  activeQuestion: {
    fontSize: 17,
    fontWeight: "700",
    color: Colors.textPrimary,
    lineHeight: 24,
  },
  activeDesc: { ...Typography.caption, color: Colors.textSecondary, lineHeight: 18 },

  // Options
  optionsCol: { flexDirection: "column", gap: Spacing.sm, marginTop: 4 },
  optionsRow: { flexDirection: "row", gap: Spacing.sm, marginTop: 4 },
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
  optionBtnSelected: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  optionBtnWarn: { backgroundColor: Colors.warningLight, borderColor: Colors.warning },
  optionBtnDimmed: { opacity: 0.4 },
  optionBtnPrevious: {
    borderColor: "#F59E0B",
    backgroundColor: "#FFFBEB",
  },
  optionBtnText: { fontSize: 15, fontWeight: "600", color: Colors.textPrimary, textAlign: "center" },
  optionBtnTextSelected: { color: Colors.surface },
  optionBtnTextWarn: { color: "#92400E" },
  optionBtnTextPrevious: { color: "#92400E" },

  noOptionsWrap: { flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 8 },
  noOptionsText: { ...Typography.caption, color: Colors.textMuted, flex: 1 },

  readonlyNote: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
  },
  readonlyNoteText: { ...Typography.caption, color: Colors.textMuted, flex: 1 },

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
  blockerTitle: { fontSize: 15, fontWeight: "700", color: "#92400E" },
  blockerText: { ...Typography.caption, color: "#78350F", lineHeight: 19 },
  blockerLink: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
  blockerLinkText: { ...Typography.caption, fontWeight: "600", color: Colors.primary },

  // Done card
  doneCard: { alignItems: "center", paddingVertical: Spacing.xl, gap: Spacing.sm },
  doneTitle: { ...Typography.h2, color: Colors.secondary },
  doneSub: { ...Typography.body, color: Colors.textSecondary, textAlign: "center" },
});
