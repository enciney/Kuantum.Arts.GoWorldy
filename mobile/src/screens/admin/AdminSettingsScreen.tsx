import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Switch,
  Alert,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useAuth } from "../../context/AuthContext";
import { api, SystemSettings } from "../../services/api";
import { Colors } from "../../theme";
import { loadAdminSettings, saveSettingsHandler } from "./adminSettingsHandlers";
import { AdminLayout } from "./AdminLayout";

type SettingsTab = "forum" | "guide" | "notifications";

const TAB_LABELS: Record<SettingsTab, string> = {
  forum: "Forum",
  guide: "Rehber",
  notifications: "Bildirimler",
};

export function AdminSettingsScreen() {
  const { token } = useAuth();
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [draft, setDraft] = useState<Partial<SystemSettings>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedMsg, setSavedMsg] = useState(false);
  const [activeTab, setActiveTab] = useState<SettingsTab>("forum");

  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        if (!token) return;
        setLoading(true);
        setError(null);
        const result = await loadAdminSettings(token, api.admin);
        if (!active) return;
        setSettings(result.settings);
        setDraft(result.settings ?? {});
        setError(result.error);
        setLoading(false);
      })();
      return () => { active = false; };
    }, [token])
  );

  const patch = (key: keyof SystemSettings, value: string | number | boolean) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  };

  const setNum = (key: keyof SystemSettings, value: string) => {
    const n = parseInt(value, 10);
    patch(key, isNaN(n) ? 0 : n);
  };

  const numVal = (key: keyof SystemSettings): string =>
    String((draft[key] as number | undefined) ?? 0);

  const boolVal = (key: keyof SystemSettings): boolean =>
    Boolean(draft[key] ?? false);

  const isDirty = JSON.stringify(draft) !== JSON.stringify(settings);

  const handleSave = async () => {
    if (!token || !draft) return;
    setSaving(true);
    const ok = await saveSettingsHandler(draft, token, api.admin);
    setSaving(false);
    if (ok) {
      setSettings({ ...(settings ?? ({} as SystemSettings)), ...draft });
      setSavedMsg(true);
      setTimeout(() => setSavedMsg(false), 2500);
    } else {
      Alert.alert("Hata", "Ayarlar kaydedilemedi");
    }
  };

  return (
    <AdminLayout title="Sistem Ayarları">
      {/* Save bar */}
      <View style={styles.saveBar}>
        <Text style={styles.subtext}>Değişiklikler anında geçerli olur.</Text>
        <View style={styles.saveBarRight}>
          {savedMsg && (
            <View style={styles.savedChip}>
              <Text style={styles.savedChipText}>✓ Kaydedildi</Text>
            </View>
          )}
          <TouchableOpacity
            style={[styles.saveBtn, (!isDirty || saving) && styles.saveBtnDisabled]}
            disabled={!isDirty || saving}
            onPress={handleSave}
            activeOpacity={0.7}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.saveBtnText}>Kaydet</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {loading ? (
        <ActivityIndicator color={Colors.primary} style={styles.loader} />
      ) : !draft ? (
        <Text style={styles.errorText}>Ayarlar yüklenemedi.</Text>
      ) : (
        <>
          {/* Tabs */}
          <View style={styles.tabs}>
            {(Object.keys(TAB_LABELS) as SettingsTab[]).map((t) => (
              <TouchableOpacity
                key={t}
                style={[styles.tabBtn, activeTab === t && styles.tabBtnActive]}
                onPress={() => setActiveTab(t)}
                activeOpacity={0.7}
              >
                <Text style={[styles.tabText, activeTab === t && styles.tabTextActive]}>
                  {TAB_LABELS[t]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.card}>
            {activeTab === "forum" && (
              <>
                <NumericRow
                  label="Yorum Düzenleme Penceresi (Dakika)"
                  desc="Yorum yazıldıktan kaç dakika sonrasına kadar düzenlenebilir"
                  value={numVal("commentEditWindowMinutes")}
                  onChange={(v) => setNum("commentEditWindowMinutes", v)}
                />
                <NumericRow
                  label="Yorum Silme Penceresi (Dakika)"
                  desc="Yorum yazıldıktan kaç dakika sonrasına kadar silinebilir"
                  value={numVal("commentDeleteWindowMinutes")}
                  onChange={(v) => setNum("commentDeleteWindowMinutes", v)}
                  last
                />
              </>
            )}

            {activeTab === "guide" && (
              <>
                <BoolRow
                  label="Göç Rehberi Bildirimleri"
                  desc="Rehber adımları için bildirim gönderilsin mi"
                  value={boolVal("guideEnableNotifications")}
                  onChange={(v) => patch("guideEnableNotifications", v)}
                />
                <BoolRow
                  label="Rehber Önerileri"
                  desc="Kullanıcılara rehber önerileri gösterilsin mi"
                  value={boolVal("guideEnableRecommendations")}
                  onChange={(v) => patch("guideEnableRecommendations", v)}
                  last
                />
              </>
            )}

            {activeTab === "notifications" && (
              <>
                <BoolRow
                  label="E-posta Bildirimleri"
                  desc="Kullanıcılara e-posta bildirimi gönderilsin mi (SendGrid)"
                  value={boolVal("notificationsEnableEmail")}
                  onChange={(v) => patch("notificationsEnableEmail", v)}
                />
                <BoolRow
                  label="Uygulama İçi Bildirimler"
                  desc="In-app bildirimler aktif mi"
                  value={boolVal("notificationsEnableInApp")}
                  onChange={(v) => patch("notificationsEnableInApp", v)}
                  last
                />
              </>
            )}
          </View>

          <Text style={styles.hint}>
            Premium plan fiyatları Premium → Planlar sekmesinden yönetilir.
          </Text>
        </>
      )}
    </AdminLayout>
  );
}

function NumericRow({
  label,
  desc,
  value,
  onChange,
  last = false,
}: {
  label: string;
  desc?: string;
  value: string;
  onChange: (v: string) => void;
  last?: boolean;
}) {
  return (
    <View style={[rowStyles.row, !last && rowStyles.rowBorder]}>
      <View style={rowStyles.labelWrap}>
        <Text style={rowStyles.label}>{label}</Text>
        {desc && <Text style={rowStyles.desc}>{desc}</Text>}
      </View>
      <TextInput
        style={rowStyles.input}
        value={value}
        onChangeText={onChange}
        keyboardType="numeric"
        selectTextOnFocus
      />
    </View>
  );
}

function BoolRow({
  label,
  desc,
  value,
  onChange,
  last = false,
}: {
  label: string;
  desc?: string;
  value: boolean;
  onChange: (v: boolean) => void;
  last?: boolean;
}) {
  return (
    <View style={[rowStyles.row, !last && rowStyles.rowBorder]}>
      <View style={rowStyles.labelWrap}>
        <Text style={rowStyles.label}>{label}</Text>
        {desc && <Text style={rowStyles.desc}>{desc}</Text>}
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: "#D1D5DB", true: "#93C5FD" }}
        thumbColor={value ? "#3B82F6" : "#FFFFFF"}
      />
    </View>
  );
}

const rowStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  labelWrap: { flex: 1, paddingRight: 12 },
  label: { fontSize: 14, fontWeight: "500", color: "#1E293B" },
  desc: { fontSize: 12, color: "#94A3B8", marginTop: 2 },
  input: {
    width: 90,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    textAlign: "right",
    color: "#1E293B",
    fontSize: 14,
    backgroundColor: "#F8FAFC",
  },
});

const styles = StyleSheet.create({
  saveBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
    gap: 8,
  },
  subtext: { fontSize: 12, color: "#64748B", flex: 1 },
  saveBarRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  savedChip: {
    backgroundColor: "#D1FAE5",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  savedChipText: { color: "#065F46", fontSize: 12, fontWeight: "600" },
  saveBtn: {
    backgroundColor: "#3B82F6",
    borderRadius: 8,
    paddingHorizontal: 18,
    paddingVertical: 9,
    minWidth: 80,
    alignItems: "center",
  },
  saveBtnDisabled: { opacity: 0.5 },
  saveBtnText: { color: "#FFFFFF", fontWeight: "700", fontSize: 14 },
  errorBox: { marginBottom: 10 },
  errorText: { fontSize: 13, color: "#DC2626" },
  loader: { marginTop: 32 },
  tabs: {
    flexDirection: "row",
    marginBottom: 14,
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 4,
    gap: 4,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 9,
    alignItems: "center",
    borderRadius: 8,
  },
  tabBtnActive: { backgroundColor: "#3B82F6" },
  tabText: { fontSize: 13, color: "#64748B", fontWeight: "500" },
  tabTextActive: { color: "#FFFFFF", fontWeight: "700" },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingHorizontal: 16,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
    marginBottom: 14,
  },
  hint: { fontSize: 12, color: "#94A3B8", marginTop: 4 },
});
