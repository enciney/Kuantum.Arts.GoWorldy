import { useEffect, useState } from "react";
import { useAuth } from "../AuthContext";
import { api, PremiumPlan, PremiumFeature, PremiumMainFeature, User } from "../api";

type Tab = "plans" | "features" | "users";

const DURATION_OPTIONS = [
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

// ── Feature checkbox selector ────────────────────────────────────────────────

function FeatureSelector({
  catalog,
  selectedKeys,
  onChange,
}: {
  catalog: PremiumFeature[];
  selectedKeys: string[];
  onChange: (nextKeys: string[], nextNames: string[]) => void;
}) {
  const toggle = (f: PremiumFeature) => {
    const isOn = selectedKeys.includes(f.key);
    const nextKeys = isOn ? selectedKeys.filter((k) => k !== f.key) : [...selectedKeys, f.key];
    const nextNames = nextKeys
      .map((k) => catalog.find((c) => c.key === k)?.name)
      .filter((n): n is string => !!n);
    onChange(nextKeys, nextNames);
  };
  const active = catalog.filter((f) => f.isActive);
  if (active.length === 0) {
    return <p style={{ fontSize: 12, color: "#94A3B8" }}>Henüz özellik tanımlı değil. "Özellik Seti" sekmesinden ekleyin.</p>;
  }
  return (
    <div style={css.featureCheckboxList}>
      {active.map((f) => (
        <label key={f.id} style={css.featureCheckboxRow}>
          <input
            type="checkbox"
            checked={selectedKeys.includes(f.key)}
            onChange={() => toggle(f)}
          />
          <span style={{ fontWeight: 500 }}>{f.name}</span>
          <code style={css.featureKey}>{f.key}</code>
          {f.description && <span style={css.featureCheckboxDesc}>— {f.description}</span>}
        </label>
      ))}
    </div>
  );
}

// ── Plans tab ────────────────────────────────────────────────────────────────

function PlansTab() {
  const { token } = useAuth();
  const [plans, setPlans] = useState<PremiumPlan[]>([]);
  const [catalog, setCatalog] = useState<PremiumFeature[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
  const [saving, setSaving] = useState(false);

  const load = () => {
    if (!token) return;
    setLoading(true);
    Promise.all([
      api.admin.getPremiumPlans(token),
      api.admin.getPremiumFeatures(token).catch(() => [] as PremiumFeature[]),
    ])
      .then(([pl, cat]) => {
        setPlans(pl);
        setCatalog(cat);
      })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "Yüklenemedi"))
      .finally(() => setLoading(false));
  };

  useEffect(load, [token]);

  const startEdit = (plan: PremiumPlan) => {
    setEditId(plan.id);
    setEditDraft({ ...plan, features: [...plan.features], featureKeys: [...(plan.featureKeys ?? [])] });
  };

  const saveEdit = async () => {
    if (!token || !editId) return;
    setSaving(true);
    try {
      const { id: _, createdAt: __, ...data } = editDraft as PremiumPlan;
      await api.admin.updatePremiumPlan(editId, data, token);
      setEditId(null);
      load();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Kaydedilemedi");
    } finally {
      setSaving(false);
    }
  };

  const resetNewDraft = () => setNewDraft({
    isActive: true,
    features: [],
    featureKeys: [],
    isSubscription: false,
    subscriptionDiscountPercent: 15,
  });

  const toggleActive = async (plan: PremiumPlan) => {
    if (!token) return;
    try {
      await api.admin.updatePremiumPlan(plan.id, { isActive: !plan.isActive }, token);
      load();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Güncellenemedi");
    }
  };

  const deletePlan = async (id: string) => {
    if (!token || !window.confirm("Bu planı silmek istiyor musunuz?")) return;
    try {
      await api.admin.deletePremiumPlan(id, token);
      load();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Silinemedi");
    }
  };

  const createPlan = async () => {
    if (!token) return;
    const { name, price, durationDays, description, features, isActive } = newDraft;
    if (!name || price == null || !durationDays) {
      alert("Ad, fiyat ve süre zorunlu");
      return;
    }
    setSaving(true);
    try {
      await api.admin.createPremiumPlan({
        name: name!,
        description: description ?? "",
        price: Number(price),
        durationDays: Number(durationDays),
        features: (features as string[]) ?? [],
        featureKeys: (newDraft.featureKeys as string[]) ?? [],
        isSubscription: newDraft.isSubscription === true,
        subscriptionDiscountPercent: Number(newDraft.subscriptionDiscountPercent ?? 0),
        isActive: isActive !== false,
      }, token);
      setShowNew(false);
      resetNewDraft();
      load();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Oluşturulamadı");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={css.loading}>Yükleniyor...</div>;
  if (error) return <div style={css.error}>{error}</div>;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <span style={{ fontSize: 14, color: "#64748B" }}>{plans.length} plan</span>
        <button style={css.btnPrimary} onClick={() => setShowNew(true)}>+ Yeni Plan</button>
      </div>

      {showNew && (
        <div style={css.card}>
          <h4 style={css.cardTitle}>Yeni Plan</h4>
          <div style={css.formGrid}>
            <Field label="Ad" value={newDraft.name ?? ""} onChange={(v) => setNewDraft({ ...newDraft, name: v })} />
            <Field label="Açıklama" value={newDraft.description ?? ""} onChange={(v) => setNewDraft({ ...newDraft, description: v })} />
            <Field label="Fiyat (TL)" type="number" value={String(newDraft.price ?? "")} onChange={(v) => setNewDraft({ ...newDraft, price: Number(v) })} />
            <Field label="Süre (gün)" type="number" value={String(newDraft.durationDays ?? "")} onChange={(v) => setNewDraft({ ...newDraft, durationDays: Number(v) })} />
          </div>
          <div style={css.subscriptionBlock}>
            <label style={css.checkboxRow}>
              <input
                type="checkbox"
                checked={newDraft.isSubscription === true}
                onChange={(e) => setNewDraft({ ...newDraft, isSubscription: e.target.checked })}
              />
              <span style={{ fontWeight: 500 }}>Abonelik (otomatik yenilenir)</span>
            </label>
            {newDraft.isSubscription && (
              <div style={{ marginTop: 8, maxWidth: 240 }}>
                <Field
                  label="AutoRenew indirimi (%)"
                  type="number"
                  value={String(newDraft.subscriptionDiscountPercent ?? 0)}
                  onChange={(v) => setNewDraft({ ...newDraft, subscriptionDiscountPercent: Number(v) })}
                />
              </div>
            )}
          </div>
          <div style={{ marginTop: 12 }}>
            <label style={css.fieldLabel}>Özellikler (katalogdan seç)</label>
            <FeatureSelector
              catalog={catalog}
              selectedKeys={(newDraft.featureKeys as string[]) ?? []}
              onChange={(keys, names) => setNewDraft({ ...newDraft, featureKeys: keys, features: names })}
            />
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <button style={css.btnPrimary} onClick={createPlan} disabled={saving}>Oluştur</button>
            <button style={css.btnGhost} onClick={() => { setShowNew(false); resetNewDraft(); }}>İptal</button>
          </div>
        </div>
      )}

      {plans.map((plan) => (
        <div key={plan.id} style={css.card}>
          {editId === plan.id ? (
            <>
              <div style={css.formGrid}>
                <Field label="Ad" value={editDraft.name ?? ""} onChange={(v) => setEditDraft({ ...editDraft, name: v })} />
                <Field label="Açıklama" value={editDraft.description ?? ""} onChange={(v) => setEditDraft({ ...editDraft, description: v })} />
                <Field label="Fiyat (TL)" type="number" value={String(editDraft.price ?? "")} onChange={(v) => setEditDraft({ ...editDraft, price: Number(v) })} />
                <Field label="Süre (gün)" type="number" value={String(editDraft.durationDays ?? "")} onChange={(v) => setEditDraft({ ...editDraft, durationDays: Number(v) })} />
              </div>
              <div style={css.subscriptionBlock}>
                <label style={css.checkboxRow}>
                  <input
                    type="checkbox"
                    checked={editDraft.isSubscription === true}
                    onChange={(e) => setEditDraft({ ...editDraft, isSubscription: e.target.checked })}
                  />
                  <span style={{ fontWeight: 500 }}>Abonelik (otomatik yenilenir)</span>
                </label>
                {editDraft.isSubscription && (
                  <div style={{ marginTop: 8, maxWidth: 240 }}>
                    <Field
                      label="AutoRenew indirimi (%)"
                      type="number"
                      value={String(editDraft.subscriptionDiscountPercent ?? 0)}
                      onChange={(v) => setEditDraft({ ...editDraft, subscriptionDiscountPercent: Number(v) })}
                    />
                  </div>
                )}
              </div>
              <div style={{ marginTop: 12 }}>
                <label style={css.fieldLabel}>Özellikler (katalogdan seç)</label>
                <FeatureSelector
                  catalog={catalog}
                  selectedKeys={(editDraft.featureKeys as string[]) ?? []}
                  onChange={(keys, names) => setEditDraft({ ...editDraft, featureKeys: keys, features: names })}
                />
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                <button style={css.btnPrimary} onClick={saveEdit} disabled={saving}>Kaydet</button>
                <button style={css.btnGhost} onClick={() => setEditId(null)}>İptal</button>
              </div>
            </>
          ) : (
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6, flexWrap: "wrap" }}>
                  <span style={css.planName}>{plan.name}</span>
                  <span style={{ ...css.badge, background: plan.isActive ? "#DCFCE7" : "#F1F5F9", color: plan.isActive ? "#166534" : "#64748B" }}>
                    {plan.isActive ? "Aktif" : "Pasif"}
                  </span>
                  <span style={{ ...css.badge, background: plan.isSubscription ? "#EDE9FE" : "#FEF3C7", color: plan.isSubscription ? "#6D28D9" : "#92400E" }}>
                    {plan.isSubscription ? `Abonelik (-%${plan.subscriptionDiscountPercent})` : "Tek seferlik"}
                  </span>
                  <span style={css.planPrice}>{plan.price} TL</span>
                  <span style={css.planDuration}>{plan.durationDays} gün</span>
                </div>
                {plan.description && <p style={css.planDesc}>{plan.description}</p>}
                <div style={css.featureList}>
                  {plan.features.map((f, i) => (
                    <span key={i} style={css.featureChip}>{f}</span>
                  ))}
                </div>
              </div>
              <div style={{ display: "flex", gap: 6, marginLeft: 12 }}>
                <button style={css.btnSm} onClick={() => startEdit(plan)}>Düzenle</button>
                <button
                  style={{ ...css.btnToggle, background: plan.isActive ? "#DCFCE7" : "#F1F5F9", color: plan.isActive ? "#166534" : "#64748B" }}
                  onClick={() => toggleActive(plan)}
                >
                  {plan.isActive ? "Aktif" : "Pasif"}
                </button>
                <button style={{ ...css.btnSm, background: "#FEF2F2", color: "#DC2626" }} onClick={() => deletePlan(plan.id)}>Sil</button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Features tab ─────────────────────────────────────────────────────────────

function FeaturesTab() {
  const { token } = useAuth();
  const [mainFeatures, setMainFeatures] = useState<PremiumMainFeature[]>([]);
  const [features, setFeatures] = useState<PremiumFeature[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<Partial<PremiumFeature>>({});
  const [showNew, setShowNew] = useState(false);
  const [newDraft, setNewDraft] = useState<Partial<PremiumFeature>>({ isActive: true });
  const [saving, setSaving] = useState(false);

  const load = () => {
    if (!token) return;
    setLoading(true);
    Promise.all([
      api.admin.getPremiumMainFeatures(token).catch(() => [] as PremiumMainFeature[]),
      api.admin.getPremiumFeatures(token),
    ])
      .then(([mf, f]) => {
        setMainFeatures(mf);
        setFeatures(f);
      })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "Yüklenemedi"))
      .finally(() => setLoading(false));
  };

  useEffect(load, [token]);

  const create = async () => {
    if (!token) return;
    const { key, name, description, mainFeatureId, durationDays, quota, isActive } = newDraft;
    if (!key || !name) { alert("Kod ve ad zorunlu"); return; }
    if (!mainFeatureId) { alert("Ana paket kategorisi seçiniz"); return; }
    setSaving(true);
    try {
      await api.admin.createPremiumFeature({
        key: key!,
        name: name!,
        description: description ?? "",
        mainFeatureId: mainFeatureId ?? null,
        durationDays: durationDays ?? null,
        quota: quota ?? null,
        isActive: isActive !== false,
      }, token);
      setShowNew(false);
      setNewDraft({ isActive: true });
      load();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Oluşturulamadı");
    } finally {
      setSaving(false);
    }
  };

  const save = async () => {
    if (!token || !editId) return;
    setSaving(true);
    try {
      const { id: _, createdAt: __, ...data } = editDraft as PremiumFeature;
      await api.admin.updatePremiumFeature(editId, data, token);
      setEditId(null);
      load();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Kaydedilemedi");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (f: PremiumFeature) => {
    if (!token) return;
    try {
      await api.admin.updatePremiumFeature(f.id, { isActive: !f.isActive }, token);
      load();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Güncellenemedi");
    }
  };

  const toggleMainActive = async (mf: PremiumMainFeature) => {
    if (!token) return;
    try {
      await api.admin.updatePremiumMainFeature(mf.id, { isActive: !mf.isActive }, token);
      load();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Güncellenemedi");
    }
  };

  const remove = async (id: string) => {
    if (!token || !window.confirm("Bu özelliği silmek istiyor musunuz?")) return;
    try {
      await api.admin.deletePremiumFeature(id, token);
      load();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Silinemedi");
    }
  };

  if (loading) return <div style={css.loading}>Yükleniyor...</div>;
  if (error) return <div style={css.error}>{error}</div>;

  return (
    <div>
      {/* ── Ana Paket Kategorileri tablosu ─────────────────────────────────── */}
      <div style={css.sectionHeader}>
        <h3 style={css.sectionTitle}>Ana Paket Kategorileri</h3>
        <span style={css.sectionHint}>Sistem tarafından tanımlı 3 temel kategori. Özellikler bu kategorilere bağlanır.</span>
      </div>

      <table style={{ ...css.table, marginBottom: 28 }}>
        <thead>
          <tr>
            {["Kategori Adı", "Anahtar", "Açıklama", "Durum", "İşlem"].map((h) => (
              <th key={h} style={css.th}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {mainFeatures.map((mf) => (
            <tr key={mf.id}>
              <td style={{ ...css.td, fontWeight: 600, color: "#1E293B" }}>{mf.name}</td>
              <td style={css.td}><code style={css.featureKey}>{mf.key}</code></td>
              <td style={{ ...css.td, color: "#64748B", fontSize: 12 }}>{mf.description}</td>
              <td style={css.td}>
                <span style={{ ...css.badge, background: mf.isActive ? "#DCFCE7" : "#F1F5F9", color: mf.isActive ? "#166534" : "#64748B" }}>
                  {mf.isActive ? "Aktif" : "Pasif"}
                </span>
              </td>
              <td style={css.td}>
                <button
                  style={{ ...css.btnToggle, background: mf.isActive ? "#DCFCE7" : "#F1F5F9", color: mf.isActive ? "#166534" : "#64748B" }}
                  onClick={() => toggleMainActive(mf)}
                >
                  {mf.isActive ? "Aktif" : "Pasif"}
                </button>
              </td>
            </tr>
          ))}
          {mainFeatures.length === 0 && (
            <tr>
              <td colSpan={5} style={{ ...css.td, textAlign: "center", color: "#94A3B8" }}>Kategori bulunamadı</td>
            </tr>
          )}
        </tbody>
      </table>

      {/* ── Özellik Seti listesi ────────────────────────────────────────────── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <h3 style={{ ...css.sectionTitle, marginBottom: 2 }}>Özellik Seti</h3>
          <span style={css.sectionHint}>{features.length} özellik — planlar bu listeden özellik seçer</span>
        </div>
        <button style={css.btnPrimary} onClick={() => setShowNew(true)}>+ Yeni Özellik</button>
      </div>

      {showNew && (
        <div style={css.card}>
          <h4 style={css.cardTitle}>Yeni Özellik</h4>
          <div style={css.formGrid}>
            {/* Ana paket seçimi */}
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={css.fieldLabel}>Ana Paket Kategorisi *</label>
              <select
                style={{ ...css.input, background: "#fff" }}
                value={newDraft.mainFeatureId ?? ""}
                onChange={(e) => setNewDraft({ ...newDraft, mainFeatureId: e.target.value || null })}
              >
                <option value="">Kategori seçin...</option>
                {mainFeatures.filter((mf) => mf.isActive).map((mf) => (
                  <option key={mf.id} value={mf.id}>{mf.name}</option>
                ))}
              </select>
            </div>

            {/* Süre */}
            <div>
              <label style={css.fieldLabel}>Süre</label>
              <select
                style={{ ...css.input, background: "#fff" }}
                value={newDraft.durationDays ?? ""}
                onChange={(e) => setNewDraft({ ...newDraft, durationDays: e.target.value ? Number(e.target.value) : null })}
              >
                <option value="">Süre seçin...</option>
                {DURATION_OPTIONS.map((o) => (
                  <option key={o.days} value={o.days}>{o.label}</option>
                ))}
              </select>
            </div>

            {/* Hak sayısı */}
            <div>
              <label style={css.fieldLabel}>Hak Sayısı (quota)</label>
              <input
                type="number"
                style={css.input}
                placeholder="örn: 100"
                value={newDraft.quota ?? ""}
                onChange={(e) => setNewDraft({ ...newDraft, quota: e.target.value ? Number(e.target.value) : null })}
              />
            </div>

            <Field label="Kod (key) *" value={newDraft.key ?? ""} onChange={(v) => setNewDraft({ ...newDraft, key: v })} />
            <Field label="Ad (kullanıcıya gösterilir)" value={newDraft.name ?? ""} onChange={(v) => setNewDraft({ ...newDraft, name: v })} />

            {/* Açıklama — tam satır */}
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={css.fieldLabel}>Açıklama (kullanıcılara gösterilir)</label>
              <textarea
                style={{ ...css.input, minHeight: 64, resize: "vertical" }}
                value={newDraft.description ?? ""}
                onChange={(e) => setNewDraft({ ...newDraft, description: e.target.value })}
                placeholder="Bu özelliğin kullanıcılara sunulan açıklaması..."
              />
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <button style={css.btnPrimary} onClick={create} disabled={saving}>Oluştur</button>
            <button style={css.btnGhost} onClick={() => { setShowNew(false); setNewDraft({ isActive: true }); }}>İptal</button>
          </div>
        </div>
      )}

      {features.map((f) => {
        const mainFeature = mainFeatures.find((mf) => mf.id === f.mainFeatureId);
        return (
          <div key={f.id} style={css.card}>
            {editId === f.id ? (
              <>
                <div style={css.formGrid}>
                  {/* Ana paket seçimi */}
                  <div style={{ gridColumn: "1 / -1" }}>
                    <label style={css.fieldLabel}>Ana Paket Kategorisi</label>
                    <select
                      style={{ ...css.input, background: "#fff" }}
                      value={editDraft.mainFeatureId ?? ""}
                      onChange={(e) => setEditDraft({ ...editDraft, mainFeatureId: e.target.value || null })}
                    >
                      <option value="">Kategori seçin...</option>
                      {mainFeatures.map((mf) => (
                        <option key={mf.id} value={mf.id}>{mf.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={css.fieldLabel}>Süre</label>
                    <select
                      style={{ ...css.input, background: "#fff" }}
                      value={editDraft.durationDays ?? ""}
                      onChange={(e) => setEditDraft({ ...editDraft, durationDays: e.target.value ? Number(e.target.value) : null })}
                    >
                      <option value="">Süre seçin...</option>
                      {DURATION_OPTIONS.map((o) => (
                        <option key={o.days} value={o.days}>{o.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={css.fieldLabel}>Hak Sayısı (quota)</label>
                    <input
                      type="number"
                      style={css.input}
                      value={editDraft.quota ?? ""}
                      onChange={(e) => setEditDraft({ ...editDraft, quota: e.target.value ? Number(e.target.value) : null })}
                    />
                  </div>

                  <Field label="Kod (key)" value={editDraft.key ?? ""} onChange={(v) => setEditDraft({ ...editDraft, key: v })} />
                  <Field label="Ad" value={editDraft.name ?? ""} onChange={(v) => setEditDraft({ ...editDraft, name: v })} />

                  <div style={{ gridColumn: "1 / -1" }}>
                    <label style={css.fieldLabel}>Açıklama (kullanıcılara gösterilir)</label>
                    <textarea
                      style={{ ...css.input, minHeight: 64, resize: "vertical" }}
                      value={editDraft.description ?? ""}
                      onChange={(e) => setEditDraft({ ...editDraft, description: e.target.value })}
                    />
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                  <button style={css.btnPrimary} onClick={save} disabled={saving}>Kaydet</button>
                  <button style={css.btnGhost} onClick={() => setEditId(null)}>İptal</button>
                </div>
              </>
            ) : (
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6, flexWrap: "wrap" }}>
                    <span style={css.planName}>{f.name}</span>
                    <span style={{ ...css.badge, background: f.isActive ? "#DCFCE7" : "#F1F5F9", color: f.isActive ? "#166534" : "#64748B" }}>
                      {f.isActive ? "Aktif" : "Pasif"}
                    </span>
                    {mainFeature && (
                      <span style={{ ...css.badge, background: "#EFF6FF", color: "#1D4ED8" }}>
                        {mainFeature.name}
                      </span>
                    )}
                    {f.durationDays && (
                      <span style={{ ...css.badge, background: "#FEF3C7", color: "#92400E" }}>
                        {durationLabel(f.durationDays)}
                      </span>
                    )}
                    {f.quota && (
                      <span style={{ ...css.badge, background: "#F0FDF4", color: "#166534" }}>
                        {f.quota} hak
                      </span>
                    )}
                    <code style={css.featureKey}>{f.key}</code>
                  </div>
                  {f.description && (
                    <p style={css.descriptionBox}>{f.description}</p>
                  )}
                </div>
                <div style={{ display: "flex", gap: 6, marginLeft: 12 }}>
                  <button style={css.btnSm} onClick={() => { setEditId(f.id); setEditDraft({ ...f }); }}>Düzenle</button>
                  <button
                    style={{ ...css.btnToggle, background: f.isActive ? "#DCFCE7" : "#F1F5F9", color: f.isActive ? "#166534" : "#64748B" }}
                    onClick={() => toggleActive(f)}
                  >
                    {f.isActive ? "Aktif" : "Pasif"}
                  </button>
                  <button style={{ ...css.btnSm, background: "#FEF2F2", color: "#DC2626" }} onClick={() => remove(f.id)}>Sil</button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Users tab ────────────────────────────────────────────────────────────────

function UsersTab() {
  const { token } = useAuth();
  const [premiumUsers, setPremiumUsers] = useState<User[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [plans, setPlans] = useState<PremiumPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [grantUserId, setGrantUserId] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<string>("");
  const [search, setSearch] = useState("");
  const [acting, setActing] = useState<string | null>(null);

  const load = () => {
    if (!token) return;
    setLoading(true);
    Promise.all([
      api.admin.getPremiumUsers(token),
      api.admin.users(token),
      api.admin.getPremiumPlans(token),
    ])
      .then(([pu, au, pl]) => {
        setPremiumUsers(pu);
        setAllUsers(au);
        setPlans(pl);
      })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "Yüklenemedi"))
      .finally(() => setLoading(false));
  };

  useEffect(load, [token]);

  const grant = async (userId: string) => {
    if (!token || !selectedPlan) { alert("Plan seçin"); return; }
    setActing(userId);
    try {
      await api.admin.grantPremium(userId, selectedPlan, token);
      setGrantUserId(null);
      setSelectedPlan("");
      load();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Verilemedi");
    } finally {
      setActing(null);
    }
  };

  const revoke = async (userId: string) => {
    if (!token || !window.confirm("Premium üyeliği kaldırmak istiyor musunuz?")) return;
    setActing(userId);
    try {
      await api.admin.revokePremium(userId, token);
      load();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Kaldırılamadı");
    } finally {
      setActing(null);
    }
  };

  if (loading) return <div style={css.loading}>Yükleniyor...</div>;
  if (error) return <div style={css.error}>{error}</div>;

  const premiumIds = new Set(premiumUsers.map((u) => u.id));
  const filtered = allUsers.filter((u) =>
    !search || u.displayName.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div style={css.statsRow}>
        <div style={css.statBox}>
          <div style={css.statNum}>{premiumUsers.length}</div>
          <div style={css.statLabel}>Aktif Premium</div>
        </div>
        <div style={css.statBox}>
          <div style={css.statNum}>{allUsers.length}</div>
          <div style={css.statLabel}>Toplam Kullanıcı</div>
        </div>
      </div>

      <input
        style={css.searchInput}
        placeholder="İsim veya e-posta ara..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <table style={css.table}>
        <thead>
          <tr>
            {["Kullanıcı", "E-posta", "Rol", "Premium", "Bitiş", "İşlem"].map((h) => (
              <th key={h} style={css.th}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filtered.map((user) => {
            const isPremium = premiumIds.has(user.id);
            const pu = premiumUsers.find((u) => u.id === user.id);
            return (
              <tr key={user.id} style={{ background: isPremium ? "#FEFCE8" : "transparent" }}>
                <td style={css.td}>{user.displayName}</td>
                <td style={css.td}>{user.email}</td>
                <td style={css.td}>
                  <span style={{ ...css.badge, background: user.role === "admin" ? "#EFF6FF" : "#F1F5F9", color: user.role === "admin" ? "#1D4ED8" : "#475569" }}>
                    {user.role}
                  </span>
                </td>
                <td style={css.td}>
                  <span style={{ ...css.badge, background: isPremium ? "#DCFCE7" : "#F1F5F9", color: isPremium ? "#166534" : "#64748B" }}>
                    {isPremium ? "Premium" : "Ücretsiz"}
                  </span>
                </td>
                <td style={css.td}>
                  {pu?.premiumUntil
                    ? new Date(pu.premiumUntil).toLocaleDateString("tr-TR")
                    : "—"}
                </td>
                <td style={css.td}>
                  {grantUserId === user.id ? (
                    <div style={{ display: "flex", gap: 6 }}>
                      <select
                        style={css.select}
                        value={selectedPlan}
                        onChange={(e) => setSelectedPlan(e.target.value)}
                      >
                        <option value="">Plan seç</option>
                        {plans.filter((p) => p.isActive).map((p) => (
                          <option key={p.id} value={p.id}>{p.name} ({p.durationDays}g)</option>
                        ))}
                      </select>
                      <button style={css.btnSm} onClick={() => grant(user.id)} disabled={acting === user.id}>Ver</button>
                      <button style={css.btnGhost} onClick={() => setGrantUserId(null)}>İptal</button>
                    </div>
                  ) : isPremium ? (
                    <button
                      style={{ ...css.btnSm, background: "#FEF2F2", color: "#DC2626" }}
                      onClick={() => revoke(user.id)}
                      disabled={acting === user.id}
                    >
                      Kaldır
                    </button>
                  ) : (
                    <button
                      style={{ ...css.btnSm, background: "#F0FDF4", color: "#166534" }}
                      onClick={() => { setGrantUserId(user.id); setSelectedPlan(""); }}
                    >
                      Premium Ver
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ── Field helper ─────────────────────────────────────────────────────────────

function Field({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div>
      <label style={css.fieldLabel}>{label}</label>
      <input
        type={type}
        style={css.input}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function PremiumPage() {
  const [tab, setTab] = useState<Tab>("plans");

  return (
    <div>
      <h2 style={css.heading}>Premium Yönetimi</h2>
      <p style={css.subheading}>Premium planları düzenle, özellik setini yönet, kullanıcılara premium ver veya kaldır.</p>

      <div style={css.tabs}>
        <button style={{ ...css.tab, ...(tab === "plans" ? css.tabActive : {}) }} onClick={() => setTab("plans")}>Planlar</button>
        <button style={{ ...css.tab, ...(tab === "features" ? css.tabActive : {}) }} onClick={() => setTab("features")}>Özellik Seti</button>
        <button style={{ ...css.tab, ...(tab === "users" ? css.tabActive : {}) }} onClick={() => setTab("users")}>Kullanıcılar</button>
      </div>

      {tab === "plans" ? <PlansTab /> : tab === "features" ? <FeaturesTab /> : <UsersTab />}
    </div>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const css: Record<string, React.CSSProperties> = {
  heading: { fontSize: 24, fontWeight: 700, color: "#1E293B", marginBottom: 4 },
  subheading: { fontSize: 13, color: "#64748B", marginBottom: 20 },
  loading: { color: "#64748B", padding: 32, textAlign: "center" },
  error: { background: "#FEF2F2", color: "#DC2626", padding: "10px 14px", borderRadius: 8, fontSize: 13, marginBottom: 16 },
  tabs: { display: "flex", gap: 4, marginBottom: 20, borderBottom: "1px solid #E2E8F0", paddingBottom: 0 },
  tab: { padding: "8px 16px", fontSize: 14, fontWeight: 500, background: "none", border: "none", cursor: "pointer", color: "#64748B", borderBottom: "2px solid transparent", marginBottom: -1 },
  tabActive: { color: "#3B82F6", borderBottom: "2px solid #3B82F6" },
  card: { background: "#fff", borderRadius: 10, boxShadow: "0 1px 4px rgba(0,0,0,0.06)", padding: "16px 20px", marginBottom: 12 },
  cardTitle: { fontSize: 15, fontWeight: 600, color: "#1E293B", marginTop: 0, marginBottom: 12 },
  formGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 16px" },
  fieldLabel: { display: "block", fontSize: 12, fontWeight: 500, color: "#64748B", marginBottom: 4 },
  input: { width: "100%", padding: "7px 10px", border: "1px solid #CBD5E1", borderRadius: 6, fontSize: 13, boxSizing: "border-box" as const },
  planName: { fontSize: 15, fontWeight: 600, color: "#1E293B" },
  planPrice: { fontSize: 13, fontWeight: 700, color: "#3B82F6" },
  planDuration: { fontSize: 12, color: "#94A3B8" },
  planDesc: { fontSize: 13, color: "#64748B", marginTop: 2, marginBottom: 6 },
  descriptionBox: { fontSize: 13, color: "#475569", marginTop: 6, marginBottom: 4, background: "#F8FAFC", borderLeft: "3px solid #93C5FD", paddingLeft: 10, paddingTop: 6, paddingBottom: 6, borderRadius: "0 6px 6px 0" },
  featureList: { display: "flex", flexWrap: "wrap" as const, gap: 6 },
  featureChip: { background: "#F1F5F9", color: "#475569", fontSize: 12, padding: "3px 8px", borderRadius: 12 },
  featureKey: { background: "#F1F5F9", color: "#475569", fontSize: 11, padding: "2px 6px", borderRadius: 4, fontFamily: "monospace" },
  featureCheckboxList: { display: "flex", flexDirection: "column" as const, gap: 6, background: "#F8FAFC", borderRadius: 8, padding: 10, border: "1px solid #E2E8F0" },
  featureCheckboxRow: { display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#1E293B", cursor: "pointer", flexWrap: "wrap" as const },
  featureCheckboxDesc: { color: "#94A3B8", fontSize: 12 },
  subscriptionBlock: { marginTop: 12, padding: 10, background: "#FAF5FF", borderRadius: 8, border: "1px solid #E9D5FF" },
  checkboxRow: { display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#1E293B", cursor: "pointer" },
  badge: { display: "inline-block", fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 8 },
  btnPrimary: { background: "#3B82F6", color: "#fff", border: "none", padding: "7px 14px", borderRadius: 6, fontSize: 13, cursor: "pointer", fontWeight: 500 },
  btnGhost: { background: "#F1F5F9", color: "#475569", border: "none", padding: "7px 14px", borderRadius: 6, fontSize: 13, cursor: "pointer" },
  btnSm: { background: "#F1F5F9", color: "#475569", border: "none", padding: "5px 10px", borderRadius: 6, fontSize: 12, cursor: "pointer", whiteSpace: "nowrap" as const },
  btnToggle: { border: "none", padding: "5px 10px", borderRadius: 6, fontSize: 12, cursor: "pointer", whiteSpace: "nowrap" as const, fontWeight: 600 },
  statsRow: { display: "flex", gap: 12, marginBottom: 16 },
  statBox: { background: "#fff", borderRadius: 10, padding: "14px 20px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)", flex: 1, textAlign: "center" as const },
  statNum: { fontSize: 28, fontWeight: 700, color: "#1E293B" },
  statLabel: { fontSize: 12, color: "#64748B", marginTop: 2 },
  searchInput: { width: "100%", padding: "8px 12px", border: "1px solid #CBD5E1", borderRadius: 8, fontSize: 13, marginBottom: 14, boxSizing: "border-box" as const },
  table: { width: "100%", borderCollapse: "collapse" as const, background: "#fff", borderRadius: 10, overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" },
  th: { padding: "10px 14px", fontSize: 12, fontWeight: 600, color: "#64748B", background: "#F8FAFC", textAlign: "left" as const, borderBottom: "1px solid #E2E8F0" },
  td: { padding: "10px 14px", fontSize: 13, color: "#1E293B", borderBottom: "1px solid #F1F5F9", verticalAlign: "middle" as const },
  select: { padding: "5px 8px", border: "1px solid #CBD5E1", borderRadius: 6, fontSize: 12 },
  sectionHeader: { marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: 700, color: "#1E293B", margin: 0, marginBottom: 2 },
  sectionHint: { fontSize: 12, color: "#94A3B8" },
};
