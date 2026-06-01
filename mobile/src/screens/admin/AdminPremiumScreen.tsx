import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  Switch,
  ScrollView,
  FlatList,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useAuth } from "../../context/AuthContext";
import {
  api,
  PremiumPlan,
  PremiumFeature,
  PremiumMainFeature,
  AdminUser,
} from "../../services/api";
import { Colors } from "../../theme";
import { AdminLayout } from "./AdminLayout";

type Tab = "plans" | "features" | "users";

const DURATION_OPTIONS: { label: string; days: number }[] = [
  { label: "1 gün", days: 1 },
  { label: "3 gün", days: 3 },
  { label: "1 hafta", days: 7 },
  { label: "2 hafta", days: 14 },
  { label: "1 ay", days: 30 },
  { label: "3 ay", days: 90 },
  { label: "6 ay", days: 180 },
  { label: "1 yıl", days: 365 },
];

function durationLabel(days: number | null | undefined): string {
  if (!days) return "—";
  const match = DURATION_OPTIONS.find((o) => o.days === days);
  return match ? match.label : `${days} gün`;
}

// ────────────────────────────────────────────────────────────────────────────────
// Shared field components
// ────────────────────────────────────────────────────────────────────────────────

function FieldInput({
  label,
  value,
  onChange,
  numeric = false,
  placeholder = "",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  numeric?: boolean;
  placeholder?: string;
}) {
  return (
    <View style={fieldStyles.wrap}>
      <Text style={fieldStyles.label}>{label}</Text>
      <TextInput
        style={fieldStyles.input}
        value={value}
        onChangeText={onChange}
        keyboardType={numeric ? "numeric" : "default"}
        placeholder={placeholder}
        placeholderTextColor="#94A3B8"
      />
    </View>
  );
}

function DurationPicker({
  value,
  onChange,
}: {
  value: number | null | undefined;
  onChange: (v: number | null) => void;
}) {
  return (
    <View style={fieldStyles.wrap}>
      <Text style={fieldStyles.label}>Süre</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {[{ label: "Yok", days: null as number | null }, ...DURATION_OPTIONS].map((o) => {
          const active = (o.days === null && !value) || o.days === value;
          return (
            <TouchableOpacity
              key={String(o.days)}
              style={[fieldStyles.durationChip, active && fieldStyles.durationChipActive]}
              onPress={() => onChange(o.days)}
              activeOpacity={0.7}
            >
              <Text style={[fieldStyles.durationChipText, active && fieldStyles.durationChipTextActive]}>
                {o.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

// ────────────────────────────────────────────────────────────────────────────────
// Badge helper
// ────────────────────────────────────────────────────────────────────────────────

function Badge({ text, bg, color }: { text: string; bg: string; color: string }) {
  return (
    <View style={[tabStyles.badge, { backgroundColor: bg }]}>
      <Text style={[tabStyles.badgeText, { color }]}>{text}</Text>
    </View>
  );
}

// ────────────────────────────────────────────────────────────────────────────────
// PlansTab
// ────────────────────────────────────────────────────────────────────────────────

function PlansTab() {
  const { token } = useAuth();
  const [plans, setPlans] = useState<PremiumPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<Partial<PremiumPlan>>({});
  const [showNew, setShowNew] = useState(false);
  const [newDraft, setNewDraft] = useState<Partial<PremiumPlan>>({
    isActive: true,
    features: [],
    featureKeys: [],
    isSubscription: false,
    subscriptionDiscountPercent: 15,
  });

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const pl = await api.admin.getPremiumPlans(token);
      setPlans(pl);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Yüklenemedi");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const resetNew = () =>
    setNewDraft({
      isActive: true,
      features: [],
      featureKeys: [],
      isSubscription: false,
      subscriptionDiscountPercent: 15,
    });

  const handleCreate = async () => {
    if (!token) return;
    const { name, price, durationDays } = newDraft;
    if (!name || price == null || !durationDays) {
      Alert.alert("Hata", "Ad, fiyat ve süre zorunlu");
      return;
    }
    setSaving(true);
    try {
      await api.admin.createPremiumPlan(
        {
          name: name!,
          description: newDraft.description ?? "",
          price: Number(price),
          durationDays: Number(durationDays),
          features: (newDraft.features as string[]) ?? [],
          featureKeys: (newDraft.featureKeys as string[]) ?? [],
          isSubscription: newDraft.isSubscription === true,
          subscriptionDiscountPercent: Number(newDraft.subscriptionDiscountPercent ?? 0),
          isActive: newDraft.isActive !== false,
        },
        token
      );
      setShowNew(false);
      resetNew();
      load();
    } catch (e: unknown) {
      Alert.alert("Hata", e instanceof Error ? e.message : "Oluşturulamadı");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!token || !editId) return;
    setSaving(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id: _id, createdAt: _ca, ...data } = editDraft as PremiumPlan;
      await api.admin.updatePremiumPlan(editId, data, token);
      setEditId(null);
      load();
    } catch (e: unknown) {
      Alert.alert("Hata", e instanceof Error ? e.message : "Kaydedilemedi");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (plan: PremiumPlan) => {
    if (!token) return;
    try {
      await api.admin.updatePremiumPlan(plan.id, { isActive: !plan.isActive }, token);
      load();
    } catch (e: unknown) {
      Alert.alert("Hata", e instanceof Error ? e.message : "Güncellenemedi");
    }
  };

  const handleDelete = (plan: PremiumPlan) => {
    Alert.alert("Planı Sil", `"${plan.name}" silinsin mi?`, [
      { text: "Vazgeç", style: "cancel" },
      {
        text: "Sil",
        style: "destructive",
        onPress: async () => {
          if (!token) return;
          try {
            await api.admin.deletePremiumPlan(plan.id, token);
            load();
          } catch (e: unknown) {
            Alert.alert("Hata", e instanceof Error ? e.message : "Silinemedi");
          }
        },
      },
    ]);
  };

  if (loading) return <ActivityIndicator color={Colors.primary} style={{ marginTop: 24 }} />;
  if (error) return <Text style={tabStyles.error}>{error}</Text>;

  return (
    <View>
      {/* Header */}
      <View style={tabStyles.rowBetween}>
        <Text style={tabStyles.countText}>{plans.length} plan</Text>
        <TouchableOpacity style={tabStyles.btnPrimary} onPress={() => setShowNew(true)} activeOpacity={0.7}>
          <Text style={tabStyles.btnPrimaryText}>+ Yeni Plan</Text>
        </TouchableOpacity>
      </View>

      {/* New plan form */}
      {showNew && (
        <View style={tabStyles.card}>
          <Text style={tabStyles.cardTitle}>Yeni Plan</Text>
          <FieldInput label="Ad *" value={newDraft.name ?? ""} onChange={(v) => setNewDraft((d) => ({ ...d, name: v }))} />
          <FieldInput label="Açıklama" value={newDraft.description ?? ""} onChange={(v) => setNewDraft((d) => ({ ...d, description: v }))} />
          <FieldInput label="Fiyat (TL) *" value={String(newDraft.price ?? "")} onChange={(v) => setNewDraft((d) => ({ ...d, price: Number(v) }))} numeric />
          <FieldInput label="Süre (gün) *" value={String(newDraft.durationDays ?? "")} onChange={(v) => setNewDraft((d) => ({ ...d, durationDays: Number(v) }))} numeric />
          <View style={tabStyles.switchRow}>
            <Text style={tabStyles.switchLabel}>Abonelik (otomatik yenilenir)</Text>
            <Switch
              value={newDraft.isSubscription === true}
              onValueChange={(v) => setNewDraft((d) => ({ ...d, isSubscription: v }))}
              trackColor={{ false: "#D1D5DB", true: "#93C5FD" }}
              thumbColor={newDraft.isSubscription ? "#3B82F6" : "#FFFFFF"}
            />
          </View>
          {newDraft.isSubscription && (
            <FieldInput
              label="AutoRenew indirimi (%)"
              value={String(newDraft.subscriptionDiscountPercent ?? 0)}
              onChange={(v) => setNewDraft((d) => ({ ...d, subscriptionDiscountPercent: Number(v) }))}
              numeric
            />
          )}
          <View style={tabStyles.switchRow}>
            <Text style={tabStyles.switchLabel}>Aktif</Text>
            <Switch
              value={newDraft.isActive !== false}
              onValueChange={(v) => setNewDraft((d) => ({ ...d, isActive: v }))}
              trackColor={{ false: "#D1D5DB", true: "#93C5FD" }}
              thumbColor={newDraft.isActive !== false ? "#3B82F6" : "#FFFFFF"}
            />
          </View>
          <View style={tabStyles.formBtns}>
            <TouchableOpacity style={tabStyles.btnPrimary} onPress={handleCreate} disabled={saving} activeOpacity={0.7}>
              <Text style={tabStyles.btnPrimaryText}>{saving ? "..." : "Oluştur"}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={tabStyles.btnGhost} onPress={() => { setShowNew(false); resetNew(); }} activeOpacity={0.7}>
              <Text style={tabStyles.btnGhostText}>İptal</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Plans list */}
      {plans.map((plan) => (
        <View key={plan.id} style={tabStyles.card}>
          {editId === plan.id ? (
            <>
              <FieldInput label="Ad" value={editDraft.name ?? ""} onChange={(v) => setEditDraft((d) => ({ ...d, name: v }))} />
              <FieldInput label="Açıklama" value={editDraft.description ?? ""} onChange={(v) => setEditDraft((d) => ({ ...d, description: v }))} />
              <FieldInput label="Fiyat (TL)" value={String(editDraft.price ?? "")} onChange={(v) => setEditDraft((d) => ({ ...d, price: Number(v) }))} numeric />
              <FieldInput label="Süre (gün)" value={String(editDraft.durationDays ?? "")} onChange={(v) => setEditDraft((d) => ({ ...d, durationDays: Number(v) }))} numeric />
              <View style={tabStyles.switchRow}>
                <Text style={tabStyles.switchLabel}>Abonelik</Text>
                <Switch
                  value={editDraft.isSubscription === true}
                  onValueChange={(v) => setEditDraft((d) => ({ ...d, isSubscription: v }))}
                  trackColor={{ false: "#D1D5DB", true: "#93C5FD" }}
                  thumbColor={editDraft.isSubscription ? "#3B82F6" : "#FFFFFF"}
                />
              </View>
              {editDraft.isSubscription && (
                <FieldInput
                  label="AutoRenew indirimi (%)"
                  value={String(editDraft.subscriptionDiscountPercent ?? 0)}
                  onChange={(v) => setEditDraft((d) => ({ ...d, subscriptionDiscountPercent: Number(v) }))}
                  numeric
                />
              )}
              <View style={tabStyles.switchRow}>
                <Text style={tabStyles.switchLabel}>Aktif</Text>
                <Switch
                  value={editDraft.isActive !== false}
                  onValueChange={(v) => setEditDraft((d) => ({ ...d, isActive: v }))}
                  trackColor={{ false: "#D1D5DB", true: "#93C5FD" }}
                  thumbColor={editDraft.isActive !== false ? "#3B82F6" : "#FFFFFF"}
                />
              </View>
              <View style={tabStyles.formBtns}>
                <TouchableOpacity style={tabStyles.btnPrimary} onPress={handleSaveEdit} disabled={saving} activeOpacity={0.7}>
                  <Text style={tabStyles.btnPrimaryText}>{saving ? "..." : "Kaydet"}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={tabStyles.btnGhost} onPress={() => setEditId(null)} activeOpacity={0.7}>
                  <Text style={tabStyles.btnGhostText}>İptal</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              <View style={tabStyles.planHeader}>
                <Text style={tabStyles.planName}>{plan.name}</Text>
                <View style={tabStyles.badgeRow}>
                  <Badge
                    text={plan.isActive ? "Aktif" : "Pasif"}
                    bg={plan.isActive ? "#DCFCE7" : "#F1F5F9"}
                    color={plan.isActive ? "#166534" : "#64748B"}
                  />
                  <Badge
                    text={plan.isSubscription ? `Abonelik -${plan.subscriptionDiscountPercent}%` : "Tek seferlik"}
                    bg={plan.isSubscription ? "#EDE9FE" : "#FEF3C7"}
                    color={plan.isSubscription ? "#6D28D9" : "#92400E"}
                  />
                </View>
              </View>
              <View style={tabStyles.planMeta}>
                <Text style={tabStyles.planPrice}>{plan.price} TL</Text>
                <Text style={tabStyles.planDuration}>{plan.durationDays} gün</Text>
              </View>
              {plan.description ? <Text style={tabStyles.planDesc}>{plan.description}</Text> : null}
              {plan.features && plan.features.length > 0 && (
                <View style={tabStyles.chipRow}>
                  {plan.features.map((f, i) => (
                    <View key={i} style={tabStyles.chip}>
                      <Text style={tabStyles.chipText}>{f}</Text>
                    </View>
                  ))}
                </View>
              )}
              <View style={tabStyles.cardActions}>
                <TouchableOpacity
                  style={tabStyles.btnSm}
                  onPress={() => {
                    setEditId(plan.id);
                    setEditDraft({ ...plan, features: [...plan.features], featureKeys: [...(plan.featureKeys ?? [])] });
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={tabStyles.btnSmText}>Düzenle</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[tabStyles.btnSm, { backgroundColor: plan.isActive ? "#DCFCE7" : "#F1F5F9" }]}
                  onPress={() => handleToggleActive(plan)}
                  activeOpacity={0.7}
                >
                  <Text style={[tabStyles.btnSmText, { color: plan.isActive ? "#166534" : "#64748B" }]}>
                    {plan.isActive ? "Aktif" : "Pasif"}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[tabStyles.btnSm, { backgroundColor: "#FEF2F2" }]}
                  onPress={() => handleDelete(plan)}
                  activeOpacity={0.7}
                >
                  <Text style={[tabStyles.btnSmText, { color: "#DC2626" }]}>Sil</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      ))}
    </View>
  );
}

// ────────────────────────────────────────────────────────────────────────────────
// FeaturesTab
// ────────────────────────────────────────────────────────────────────────────────

function FeaturesTab() {
  const { token } = useAuth();
  const [mainFeatures, setMainFeatures] = useState<PremiumMainFeature[]>([]);
  const [features, setFeatures] = useState<PremiumFeature[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<Partial<PremiumFeature>>({});
  const [showNew, setShowNew] = useState(false);
  const [newDraft, setNewDraft] = useState<Partial<PremiumFeature>>({ isActive: true });

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [mf, f] = await Promise.all([
        api.admin.getPremiumMainFeatures(token).catch(() => [] as PremiumMainFeature[]),
        api.admin.getPremiumFeatures(token),
      ]);
      setMainFeatures(mf);
      setFeatures(f);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Yüklenemedi");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const handleCreate = async () => {
    if (!token) return;
    const { key, name, mainFeatureId } = newDraft;
    if (!key || !name) { Alert.alert("Hata", "Kod ve ad zorunlu"); return; }
    if (!mainFeatureId) { Alert.alert("Hata", "Ana paket kategorisi seçiniz"); return; }
    setSaving(true);
    try {
      await api.admin.createPremiumFeature(
        {
          key: key!,
          name: name!,
          description: newDraft.description ?? "",
          mainFeatureId: mainFeatureId ?? null,
          durationDays: newDraft.durationDays ?? null,
          quota: newDraft.quota ?? null,
          isActive: newDraft.isActive !== false,
        },
        token
      );
      setShowNew(false);
      setNewDraft({ isActive: true });
      load();
    } catch (e: unknown) {
      Alert.alert("Hata", e instanceof Error ? e.message : "Oluşturulamadı");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!token || !editId) return;
    setSaving(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id: _id, createdAt: _ca, ...data } = editDraft as PremiumFeature;
      await api.admin.updatePremiumFeature(editId, data, token);
      setEditId(null);
      load();
    } catch (e: unknown) {
      Alert.alert("Hata", e instanceof Error ? e.message : "Kaydedilemedi");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleFeature = async (f: PremiumFeature) => {
    if (!token) return;
    try {
      await api.admin.updatePremiumFeature(f.id, { isActive: !f.isActive }, token);
      load();
    } catch {
      Alert.alert("Hata", "Güncellenemedi");
    }
  };

  const handleToggleMain = async (mf: PremiumMainFeature) => {
    if (!token) return;
    try {
      await api.admin.updatePremiumMainFeature(mf.id, { isActive: !mf.isActive }, token);
      load();
    } catch {
      Alert.alert("Hata", "Güncellenemedi");
    }
  };

  const handleDelete = (f: PremiumFeature) => {
    Alert.alert("Özelliği Sil", `"${f.name}" silinsin mi?`, [
      { text: "Vazgeç", style: "cancel" },
      {
        text: "Sil",
        style: "destructive",
        onPress: async () => {
          if (!token) return;
          try {
            await api.admin.deletePremiumFeature(f.id, token);
            load();
          } catch (e: unknown) {
            Alert.alert("Hata", e instanceof Error ? e.message : "Silinemedi");
          }
        },
      },
    ]);
  };

  if (loading) return <ActivityIndicator color={Colors.primary} style={{ marginTop: 24 }} />;
  if (error) return <Text style={tabStyles.error}>{error}</Text>;

  function CategoryChips({ value, onChange }: { value: string | null | undefined; onChange: (v: string) => void }) {
    return (
      <View style={fieldStyles.wrap}>
        <Text style={fieldStyles.label}>Ana Paket Kategorisi *</Text>
        <View style={tabStyles.chipRow}>
          {mainFeatures.map((m) => {
            const active = value === m.id;
            return (
              <TouchableOpacity
                key={m.id}
                style={[tabStyles.chip, active && { backgroundColor: "#3B82F6" }]}
                onPress={() => onChange(m.id)}
                activeOpacity={0.7}
              >
                <Text style={[tabStyles.chipText, active && { color: "#FFFFFF" }]}>{m.name}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  }

  return (
    <View>
      {/* Ana Paket Kategorileri */}
      <Text style={tabStyles.sectionTitle}>Ana Paket Kategorileri</Text>
      <Text style={tabStyles.sectionHint}>Sistem tarafından tanımlı 3 temel kategori. Özellikler bu kategorilere bağlanır.</Text>
      {mainFeatures.map((mf) => (
        <View key={mf.id} style={[tabStyles.card, { flexDirection: "row", alignItems: "center" }]}>
          <View style={{ flex: 1 }}>
            <Text style={tabStyles.planName}>{mf.name}</Text>
            <Text style={tabStyles.planDesc}>{mf.description}</Text>
            <Text style={tabStyles.keyCode}>{mf.key}</Text>
          </View>
          <TouchableOpacity
            style={[tabStyles.btnSm, { backgroundColor: mf.isActive ? "#DCFCE7" : "#F1F5F9", marginLeft: 8 }]}
            onPress={() => handleToggleMain(mf)}
            activeOpacity={0.7}
          >
            <Text style={[tabStyles.btnSmText, { color: mf.isActive ? "#166534" : "#64748B" }]}>
              {mf.isActive ? "Aktif" : "Pasif"}
            </Text>
          </TouchableOpacity>
        </View>
      ))}

      {/* Özellik Seti */}
      <View style={[tabStyles.rowBetween, { marginTop: 20 }]}>
        <View>
          <Text style={tabStyles.sectionTitle}>Özellik Seti</Text>
          <Text style={tabStyles.sectionHint}>{features.length} özellik</Text>
        </View>
        <TouchableOpacity style={tabStyles.btnPrimary} onPress={() => setShowNew(true)} activeOpacity={0.7}>
          <Text style={tabStyles.btnPrimaryText}>+ Yeni Özellik</Text>
        </TouchableOpacity>
      </View>

      {showNew && (
        <View style={tabStyles.card}>
          <Text style={tabStyles.cardTitle}>Yeni Özellik</Text>
          <CategoryChips value={newDraft.mainFeatureId} onChange={(v) => setNewDraft((d) => ({ ...d, mainFeatureId: v }))} />
          <DurationPicker value={newDraft.durationDays} onChange={(v) => setNewDraft((d) => ({ ...d, durationDays: v }))} />
          <FieldInput label="Hak Sayısı (quota)" value={String(newDraft.quota ?? "")} onChange={(v) => setNewDraft((d) => ({ ...d, quota: v ? Number(v) : null }))} numeric placeholder="örn: 100" />
          <FieldInput label="Kod (key) *" value={newDraft.key ?? ""} onChange={(v) => setNewDraft((d) => ({ ...d, key: v }))} />
          <FieldInput label="Ad *" value={newDraft.name ?? ""} onChange={(v) => setNewDraft((d) => ({ ...d, name: v }))} />
          <FieldInput label="Açıklama" value={newDraft.description ?? ""} onChange={(v) => setNewDraft((d) => ({ ...d, description: v }))} />
          <View style={tabStyles.formBtns}>
            <TouchableOpacity style={tabStyles.btnPrimary} onPress={handleCreate} disabled={saving} activeOpacity={0.7}>
              <Text style={tabStyles.btnPrimaryText}>{saving ? "..." : "Oluştur"}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={tabStyles.btnGhost} onPress={() => { setShowNew(false); setNewDraft({ isActive: true }); }} activeOpacity={0.7}>
              <Text style={tabStyles.btnGhostText}>İptal</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {features.map((f) => {
        const mf = mainFeatures.find((m) => m.id === f.mainFeatureId);
        return (
          <View key={f.id} style={tabStyles.card}>
            {editId === f.id ? (
              <>
                <CategoryChips
                  value={editDraft.mainFeatureId}
                  onChange={(v) => setEditDraft((d) => ({ ...d, mainFeatureId: v }))}
                />
                <DurationPicker
                  value={editDraft.durationDays}
                  onChange={(v) => setEditDraft((d) => ({ ...d, durationDays: v }))}
                />
                <FieldInput label="Hak Sayısı" value={String(editDraft.quota ?? "")} onChange={(v) => setEditDraft((d) => ({ ...d, quota: v ? Number(v) : null }))} numeric />
                <FieldInput label="Kod (key)" value={editDraft.key ?? ""} onChange={(v) => setEditDraft((d) => ({ ...d, key: v }))} />
                <FieldInput label="Ad" value={editDraft.name ?? ""} onChange={(v) => setEditDraft((d) => ({ ...d, name: v }))} />
                <FieldInput label="Açıklama" value={editDraft.description ?? ""} onChange={(v) => setEditDraft((d) => ({ ...d, description: v }))} />
                <View style={tabStyles.formBtns}>
                  <TouchableOpacity style={tabStyles.btnPrimary} onPress={handleSaveEdit} disabled={saving} activeOpacity={0.7}>
                    <Text style={tabStyles.btnPrimaryText}>{saving ? "..." : "Kaydet"}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={tabStyles.btnGhost} onPress={() => setEditId(null)} activeOpacity={0.7}>
                    <Text style={tabStyles.btnGhostText}>İptal</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <>
                <View style={tabStyles.planHeader}>
                  <Text style={tabStyles.planName}>{f.name}</Text>
                  <View style={tabStyles.badgeRow}>
                    <Badge text={f.isActive ? "Aktif" : "Pasif"} bg={f.isActive ? "#DCFCE7" : "#F1F5F9"} color={f.isActive ? "#166534" : "#64748B"} />
                    {mf ? <Badge text={mf.name} bg="#EFF6FF" color="#1D4ED8" /> : null}
                    {f.durationDays ? <Badge text={durationLabel(f.durationDays)} bg="#FEF3C7" color="#92400E" /> : null}
                    {f.quota ? <Badge text={`${f.quota} hak`} bg="#F0FDF4" color="#166534" /> : null}
                  </View>
                </View>
                <Text style={tabStyles.keyCode}>{f.key}</Text>
                {f.description ? (
                  <View style={tabStyles.descBox}>
                    <Text style={tabStyles.descBoxText}>{f.description}</Text>
                  </View>
                ) : null}
                <View style={tabStyles.cardActions}>
                  <TouchableOpacity
                    style={tabStyles.btnSm}
                    onPress={() => { setEditId(f.id); setEditDraft({ ...f }); }}
                    activeOpacity={0.7}
                  >
                    <Text style={tabStyles.btnSmText}>Düzenle</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[tabStyles.btnSm, { backgroundColor: f.isActive ? "#DCFCE7" : "#F1F5F9" }]}
                    onPress={() => handleToggleFeature(f)}
                    activeOpacity={0.7}
                  >
                    <Text style={[tabStyles.btnSmText, { color: f.isActive ? "#166534" : "#64748B" }]}>
                      {f.isActive ? "Aktif" : "Pasif"}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[tabStyles.btnSm, { backgroundColor: "#FEF2F2" }]}
                    onPress={() => handleDelete(f)}
                    activeOpacity={0.7}
                  >
                    <Text style={[tabStyles.btnSmText, { color: "#DC2626" }]}>Sil</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        );
      })}
    </View>
  );
}

// ────────────────────────────────────────────────────────────────────────────────
// UsersTab
// ────────────────────────────────────────────────────────────────────────────────

function UsersTab() {
  const { token } = useAuth();
  const [premiumUsers, setPremiumUsers] = useState<AdminUser[]>([]);
  const [allUsers, setAllUsers] = useState<AdminUser[]>([]);
  const [plans, setPlans] = useState<PremiumPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [grantUserId, setGrantUserId] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<string>("");
  const [acting, setActing] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [pu, au, pl] = await Promise.all([
        api.admin.getPremiumUsers(token),
        api.admin.getUsers(token),
        api.admin.getPremiumPlans(token),
      ]);
      setPremiumUsers(pu);
      setAllUsers(au);
      setPlans(pl);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Yüklenemedi");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const handleGrant = async (userId: string) => {
    if (!token || !selectedPlan) { Alert.alert("Hata", "Plan seçin"); return; }
    setActing(userId);
    try {
      await api.admin.grantPremium(userId, selectedPlan, token);
      setGrantUserId(null);
      setSelectedPlan("");
      load();
    } catch (e: unknown) {
      Alert.alert("Hata", e instanceof Error ? e.message : "Verilemedi");
    } finally {
      setActing(null);
    }
  };

  const handleRevoke = (userId: string, name: string) => {
    Alert.alert("Premium Kaldır", `${name} için premium üyeliği kaldırılsın mı?`, [
      { text: "Vazgeç", style: "cancel" },
      {
        text: "Kaldır",
        style: "destructive",
        onPress: async () => {
          if (!token) return;
          setActing(userId);
          try {
            await api.admin.revokePremium(userId, token);
            load();
          } catch (e: unknown) {
            Alert.alert("Hata", e instanceof Error ? e.message : "Kaldırılamadı");
          } finally {
            setActing(null);
          }
        },
      },
    ]);
  };

  if (loading) return <ActivityIndicator color={Colors.primary} style={{ marginTop: 24 }} />;
  if (error) return <Text style={tabStyles.error}>{error}</Text>;

  const premiumIds = new Set(premiumUsers.map((u) => u.id));
  const lowerSearch = search.toLowerCase();
  const filtered = allUsers.filter(
    (u) =>
      !search ||
      u.displayName.toLowerCase().includes(lowerSearch) ||
      u.email.toLowerCase().includes(lowerSearch)
  );

  return (
    <View>
      {/* Stats */}
      <View style={tabStyles.statsRow}>
        <View style={tabStyles.statBox}>
          <Text style={tabStyles.statNum}>{premiumUsers.length}</Text>
          <Text style={tabStyles.statLabel}>Aktif Premium</Text>
        </View>
        <View style={tabStyles.statBox}>
          <Text style={tabStyles.statNum}>{allUsers.length}</Text>
          <Text style={tabStyles.statLabel}>Toplam Kullanıcı</Text>
        </View>
      </View>

      {/* Search */}
      <TextInput
        style={tabStyles.searchInput}
        placeholder="İsim veya e-posta ara..."
        placeholderTextColor="#94A3B8"
        value={search}
        onChangeText={setSearch}
      />

      {/* User list */}
      {filtered.map((user) => {
        const isPremium = premiumIds.has(user.id);
        const pu = premiumUsers.find((u) => u.id === user.id);
        const isGrantOpen = grantUserId === user.id;

        return (
          <View key={user.id} style={[tabStyles.card, isPremium && { borderLeftWidth: 3, borderLeftColor: "#F59E0B" }]}>
            <View style={tabStyles.rowBetween}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={tabStyles.planName}>{user.displayName}</Text>
                <Text style={tabStyles.planDesc}>{user.email}</Text>
                <View style={tabStyles.badgeRow}>
                  <Badge
                    text={user.role}
                    bg={user.role === "admin" ? "#EFF6FF" : "#F1F5F9"}
                    color={user.role === "admin" ? "#1D4ED8" : "#475569"}
                  />
                  <Badge
                    text={isPremium ? "Premium" : "Ücretsiz"}
                    bg={isPremium ? "#DCFCE7" : "#F1F5F9"}
                    color={isPremium ? "#166534" : "#64748B"}
                  />
                  {pu?.premiumUntil && (
                    <Text style={tabStyles.planDuration}>
                      {new Date(pu.premiumUntil).toLocaleDateString("tr-TR")}
                    </Text>
                  )}
                </View>
              </View>
              {!isGrantOpen && (
                isPremium ? (
                  <TouchableOpacity
                    style={[tabStyles.btnSm, { backgroundColor: "#FEF2F2" }]}
                    onPress={() => handleRevoke(user.id, user.displayName)}
                    disabled={acting === user.id}
                    activeOpacity={0.7}
                  >
                    <Text style={[tabStyles.btnSmText, { color: "#DC2626" }]}>Kaldır</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={[tabStyles.btnSm, { backgroundColor: "#F0FDF4" }]}
                    onPress={() => { setGrantUserId(user.id); setSelectedPlan(""); }}
                    activeOpacity={0.7}
                  >
                    <Text style={[tabStyles.btnSmText, { color: "#166534" }]}>Premium Ver</Text>
                  </TouchableOpacity>
                )
              )}
            </View>

            {/* Grant inline form */}
            {isGrantOpen && (
              <View style={tabStyles.grantForm}>
                <Text style={fieldStyles.label}>Plan seç:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={{ flexDirection: "row", gap: 6, marginTop: 4 }}>
                    {plans.filter((p) => p.isActive).map((p) => {
                      const active = selectedPlan === p.id;
                      return (
                        <TouchableOpacity
                          key={p.id}
                          style={[tabStyles.chip, active && { backgroundColor: "#3B82F6" }]}
                          onPress={() => setSelectedPlan(p.id)}
                          activeOpacity={0.7}
                        >
                          <Text style={[tabStyles.chipText, active && { color: "#FFFFFF" }]}>
                            {p.name} ({p.durationDays}g)
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </ScrollView>
                <View style={[tabStyles.formBtns, { marginTop: 10 }]}>
                  <TouchableOpacity
                    style={[tabStyles.btnPrimary, (!selectedPlan || acting === user.id) && { opacity: 0.5 }]}
                    onPress={() => handleGrant(user.id)}
                    disabled={acting === user.id || !selectedPlan}
                    activeOpacity={0.7}
                  >
                    <Text style={tabStyles.btnPrimaryText}>{acting === user.id ? "..." : "Uygula"}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={tabStyles.btnGhost} onPress={() => setGrantUserId(null)} activeOpacity={0.7}>
                    <Text style={tabStyles.btnGhostText}>İptal</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        );
      })}

      {filtered.length === 0 && (
        <View style={tabStyles.emptyBox}>
          <Text style={tabStyles.emptyText}>Kullanıcı bulunamadı</Text>
        </View>
      )}
    </View>
  );
}

// ────────────────────────────────────────────────────────────────────────────────
// Main screen
// ────────────────────────────────────────────────────────────────────────────────

export function AdminPremiumScreen() {
  const [tab, setTab] = useState<Tab>("plans");

  return (
    <AdminLayout title="Premium Yönetimi">
      <Text style={tabStyles.subheading}>
        Premium planları düzenle, özellik setini yönet, kullanıcılara premium ver veya kaldır.
      </Text>

      {/* Tabs */}
      <View style={tabStyles.tabs}>
        {(["plans", "features", "users"] as Tab[]).map((t) => (
          <TouchableOpacity
            key={t}
            style={[tabStyles.tabBtn, tab === t && tabStyles.tabBtnActive]}
            onPress={() => setTab(t)}
            activeOpacity={0.7}
          >
            <Text style={[tabStyles.tabBtnText, tab === t && tabStyles.tabBtnTextActive]}>
              {t === "plans" ? "Planlar" : t === "features" ? "Özellik Seti" : "Kullanıcılar"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {tab === "plans" ? <PlansTab /> : tab === "features" ? <FeaturesTab /> : <UsersTab />}
    </AdminLayout>
  );
}

// ────────────────────────────────────────────────────────────────────────────────
// Styles
// ────────────────────────────────────────────────────────────────────────────────

const fieldStyles = StyleSheet.create({
  wrap: { marginBottom: 10 },
  label: { fontSize: 11, fontWeight: "600", color: "#64748B", marginBottom: 4, textTransform: "uppercase" },
  input: {
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
    color: "#1E293B",
    backgroundColor: "#FFFFFF",
  },
  durationChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    marginRight: 6,
    backgroundColor: "#F8FAFC",
  },
  durationChipActive: { backgroundColor: "#3B82F6", borderColor: "#3B82F6" },
  durationChipText: { fontSize: 12, color: "#64748B" },
  durationChipTextActive: { color: "#FFFFFF", fontWeight: "600" },
});

const tabStyles = StyleSheet.create({
  subheading: { fontSize: 12, color: "#64748B", marginBottom: 14 },
  tabs: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 4,
    gap: 4,
    marginBottom: 14,
  },
  tabBtn: { flex: 1, paddingVertical: 9, alignItems: "center", borderRadius: 8 },
  tabBtnActive: { backgroundColor: "#3B82F6" },
  tabBtnText: { fontSize: 12, color: "#64748B", fontWeight: "500" },
  tabBtnTextActive: { color: "#FFFFFF", fontWeight: "700" },
  error: { color: "#DC2626", fontSize: 13, textAlign: "center", padding: 20 },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 14,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  cardTitle: { fontSize: 14, fontWeight: "600", color: "#1E293B", marginBottom: 10 },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  countText: { fontSize: 12, color: "#64748B" },
  sectionTitle: { fontSize: 14, fontWeight: "700", color: "#1E293B", marginBottom: 2 },
  sectionHint: { fontSize: 11, color: "#94A3B8", marginBottom: 10 },
  planHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 6,
  },
  planName: { fontSize: 14, fontWeight: "700", color: "#1E293B" },
  planMeta: { flexDirection: "row", gap: 8, alignItems: "center", marginBottom: 4 },
  planPrice: { fontSize: 13, fontWeight: "700", color: "#3B82F6" },
  planDuration: { fontSize: 12, color: "#94A3B8" },
  planDesc: { fontSize: 12, color: "#64748B", marginBottom: 6 },
  keyCode: {
    fontSize: 11,
    color: "#475569",
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: "flex-start",
    marginBottom: 4,
  },
  descBox: {
    backgroundColor: "#F8FAFC",
    borderLeftWidth: 3,
    borderLeftColor: "#93C5FD",
    paddingLeft: 10,
    paddingVertical: 6,
    borderRadius: 4,
    marginBottom: 8,
  },
  descBoxText: { fontSize: 12, color: "#475569" },
  badgeRow: { flexDirection: "row", flexWrap: "wrap", gap: 4, marginTop: 4 },
  badge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 8 },
  badgeText: { fontSize: 11, fontWeight: "600" },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 4 },
  chip: { backgroundColor: "#F1F5F9", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 },
  chipText: { fontSize: 12, color: "#475569" },
  cardActions: { flexDirection: "row", gap: 8, marginTop: 10, flexWrap: "wrap" },
  btnPrimary: { backgroundColor: "#3B82F6", borderRadius: 6, paddingHorizontal: 14, paddingVertical: 8 },
  btnPrimaryText: { color: "#FFFFFF", fontSize: 13, fontWeight: "600" },
  btnGhost: { backgroundColor: "#F1F5F9", borderRadius: 6, paddingHorizontal: 14, paddingVertical: 8 },
  btnGhostText: { color: "#475569", fontSize: 13 },
  btnSm: { backgroundColor: "#F1F5F9", borderRadius: 6, paddingHorizontal: 10, paddingVertical: 6 },
  btnSmText: { fontSize: 12, color: "#475569", fontWeight: "600" },
  formBtns: { flexDirection: "row", gap: 8, marginTop: 4 },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
    backgroundColor: "#FAF5FF",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E9D5FF",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  switchLabel: { fontSize: 13, fontWeight: "500", color: "#1E293B", flex: 1 },
  statsRow: { flexDirection: "row", gap: 10, marginBottom: 14 },
  statBox: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    padding: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  statNum: { fontSize: 26, fontWeight: "700", color: "#1E293B" },
  statLabel: { fontSize: 12, color: "#64748B", marginTop: 2 },
  searchInput: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 14,
    color: "#1E293B",
    marginBottom: 12,
  },
  grantForm: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  emptyBox: { alignItems: "center", padding: 32 },
  emptyText: { fontSize: 14, color: "#94A3B8" },
});
