import { useEffect, useState } from "react";
import { useAuth } from "../AuthContext";
import { api, SystemSettings } from "../api";

type SettingsTab = "forum" | "guide" | "notifications";

const TAB_LABELS: Record<SettingsTab, string> = {
  forum: "Forum Ayarları",
  guide: "Rehber Ayarları",
  notifications: "Bildirim Ayarları",
};

function FieldRow({
  label, desc, value, onChange, type = "number",
}: {
  label: string; desc?: string; value: string | number | boolean;
  onChange: (v: string | number | boolean) => void; type?: "number" | "boolean";
}) {
  return (
    <tr>
      <td style={css.fieldLabel}>
        <div style={{ fontWeight: 500, color: "#1E293B" }}>{label}</div>
        {desc && <div style={{ fontSize: 12, color: "#94A3B8", marginTop: 2 }}>{desc}</div>}
      </td>
      <td style={css.fieldValue}>
        {type === "boolean" ? (
          <label style={css.toggle}>
            <input
              type="checkbox"
              checked={value as boolean}
              onChange={(e) => onChange(e.target.checked)}
              style={{ marginRight: 8 }}
            />
            {value ? "Etkin" : "Devre Dışı"}
          </label>
        ) : (
          <input
            type="number"
            value={value as number}
            min={0}
            onChange={(e) => onChange(Number(e.target.value))}
            style={css.input}
          />
        )}
      </td>
    </tr>
  );
}

export default function SettingsPage() {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState<SettingsTab>("forum");
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [draft, setDraft] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!token) return;
    api.settings.get(token)
      .then((s) => { setSettings(s); setDraft(s); })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "Yüklenemedi."))
      .finally(() => setLoading(false));
  }, [token]);

  const patch = (key: keyof SystemSettings, value: string | number | boolean) => {
    setDraft((d) => d ? { ...d, [key]: value } : d);
  };

  const handleSave = async () => {
    if (!token || !draft) return;
    setSaving(true);
    setError(null);
    try {
      await api.settings.update(draft, token);
      setSettings(draft);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Kayıt başarısız.");
    } finally {
      setSaving(false);
    }
  };

  const isDirty = JSON.stringify(draft) !== JSON.stringify(settings);

  if (loading) return <div style={css.loading}>Yükleniyor...</div>;
  if (!draft) return <div style={css.error}>Ayarlar yüklenemedi.</div>;

  return (
    <div>
      <div style={css.pageHeader}>
        <div>
          <h2 style={css.heading}>Sistem Ayarları</h2>
          <p style={css.subheading}>Değişiklikler anında geçerli olur — yeniden başlatma gerekmez.</p>
        </div>
        <div style={css.headerActions}>
          {saved && <span style={css.savedChip}>✓ Kaydedildi</span>}
          <button
            style={{ ...css.saveBtn, ...((!isDirty || saving) ? css.saveBtnDisabled : {}) }}
            disabled={!isDirty || saving}
            onClick={handleSave}
          >
            {saving ? "Kaydediliyor..." : "Kaydet"}
          </button>
        </div>
      </div>

      {error && <div style={css.errorBox}>{error}</div>}

      {/* Tabs */}
      <div style={css.tabs}>
        {(Object.keys(TAB_LABELS) as SettingsTab[]).map((t) => (
          <button
            key={t}
            style={{ ...css.tab, ...(activeTab === t ? css.tabActive : {}) }}
            onClick={() => setActiveTab(t)}
          >
            {TAB_LABELS[t]}
          </button>
        ))}
      </div>

      <div style={css.card}>
        {activeTab === "forum" && (
          <table style={css.table}>
            <tbody>
              <FieldRow
                label="Konu Açma Ücreti (Kredi)"
                desc="Yeni konu açmak için gereken kredi miktarı"
                value={draft.forumCreateTopicCost}
                onChange={(v) => patch("forumCreateTopicCost", v)}
              />
              <FieldRow
                label="Yorum Erişim Ücreti (Kredi)"
                desc="Yorumlara erişim için gereken kredi miktarı"
                value={draft.forumCommentAccessCost}
                onChange={(v) => patch("forumCommentAccessCost", v)}
              />
              <FieldRow
                label="Yorum Düzenleme Penceresi (Dakika)"
                desc="Yorum yazıldıktan kaç dakika sonrasına kadar düzenlenebilir"
                value={draft.commentEditWindowMinutes}
                onChange={(v) => patch("commentEditWindowMinutes", v)}
              />
              <FieldRow
                label="Yorum Silme Penceresi (Dakika)"
                desc="Yorum yazıldıktan kaç dakika sonrasına kadar silinebilir"
                value={draft.commentDeleteWindowMinutes}
                onChange={(v) => patch("commentDeleteWindowMinutes", v)}
              />
            </tbody>
          </table>
        )}

        {activeTab === "guide" && (
          <table style={css.table}>
            <tbody>
              <FieldRow
                label="Göç Rehberi Bildirimleri"
                desc="Rehber adımları için bildirim gönderilsin mi"
                value={draft.guideEnableNotifications}
                onChange={(v) => patch("guideEnableNotifications", v)}
                type="boolean"
              />
              <FieldRow
                label="Rehber Önerileri"
                desc="Kullanıcılara rehber önerileri gösterilsin mi"
                value={draft.guideEnableRecommendations}
                onChange={(v) => patch("guideEnableRecommendations", v)}
                type="boolean"
              />
            </tbody>
          </table>
        )}

        {activeTab === "notifications" && (
          <table style={css.table}>
            <tbody>
              <FieldRow
                label="E-posta Bildirimleri"
                desc="Kullanıcılara e-posta bildirimi gönderilsin mi (SendGrid)"
                value={draft.notificationsEnableEmail}
                onChange={(v) => patch("notificationsEnableEmail", v)}
                type="boolean"
              />
              <FieldRow
                label="Uygulama İçi Bildirimler"
                desc="In-app bildirimler aktif mi"
                value={draft.notificationsEnableInApp}
                onChange={(v) => patch("notificationsEnableInApp", v)}
                type="boolean"
              />
            </tbody>
          </table>
        )}
      </div>

      <p style={css.hint}>
        Premium plan fiyatları <strong>Premium → Planlar</strong> sekmesinden yönetilir.
        Kullanıcı premium detayları <strong>Premium → Kullanıcılar</strong> sekmesindedir.
      </p>
    </div>
  );
}

const css: Record<string, React.CSSProperties> = {
  pageHeader: { display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 8 },
  heading: { fontSize: 24, fontWeight: 700, color: "#1E293B", margin: "0 0 4px" },
  subheading: { fontSize: 13, color: "#64748B", margin: 0 },
  headerActions: { display: "flex", alignItems: "center", gap: 12 },
  savedChip: { background: "#D1FAE5", color: "#065F46", fontSize: 13, fontWeight: 600, padding: "5px 12px", borderRadius: 20 },
  saveBtn: { background: "#3B82F6", color: "#fff", padding: "8px 20px", borderRadius: 8, fontSize: 14, fontWeight: 600, border: "none", cursor: "pointer" },
  saveBtnDisabled: { opacity: 0.5, cursor: "not-allowed" },
  errorBox: { background: "#FEF2F2", color: "#DC2626", padding: "10px 14px", borderRadius: 8, fontSize: 13, marginBottom: 16 },
  loading: { color: "#64748B", padding: 32, textAlign: "center" },
  error: { color: "#DC2626", padding: 32, textAlign: "center" },
  tabs: { display: "flex", gap: 4, marginBottom: 20, borderBottom: "2px solid #E2E8F0", paddingBottom: 0 },
  tab: { padding: "10px 18px", fontSize: 14, fontWeight: 500, color: "#64748B", background: "none", border: "none", cursor: "pointer", borderBottom: "2px solid transparent", marginBottom: -2 },
  tabActive: { color: "#3B82F6", borderBottom: "2px solid #3B82F6", fontWeight: 700 },
  card: { background: "#fff", borderRadius: 12, boxShadow: "0 1px 4px rgba(0,0,0,0.06)", padding: "8px 24px", marginBottom: 16 },
  table: { width: "100%", borderCollapse: "collapse" },
  fieldLabel: { padding: "16px 0", borderBottom: "1px solid #F1F5F9", width: "60%" },
  fieldValue: { padding: "16px 0", borderBottom: "1px solid #F1F5F9", textAlign: "right" },
  toggle: { display: "flex", alignItems: "center", justifyContent: "flex-end", cursor: "pointer", fontSize: 14, color: "#1E293B" },
  input: { width: 100, textAlign: "right", border: "1px solid #CBD5E1", borderRadius: 6, padding: "6px 10px", fontSize: 14, outline: "none" },
  hint: { fontSize: 13, color: "#94A3B8", marginTop: 8 },
};
