import { useEffect, useState } from "react";
import { useAuth } from "../AuthContext";
import { api, PremiumPlan, User } from "../api";

type Tab = "plans" | "users";

// ── Plans tab ────────────────────────────────────────────────────────────────

function PlansTab() {
  const { token } = useAuth();
  const [plans, setPlans] = useState<PremiumPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<Partial<PremiumPlan>>({});
  const [showNew, setShowNew] = useState(false);
  const [newDraft, setNewDraft] = useState<Partial<PremiumPlan>>({ isActive: true, features: [] });
  const [saving, setSaving] = useState(false);

  const load = () => {
    if (!token) return;
    setLoading(true);
    api.admin.getPremiumPlans(token)
      .then(setPlans)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "Yüklenemedi"))
      .finally(() => setLoading(false));
  };

  useEffect(load, [token]);

  const startEdit = (plan: PremiumPlan) => {
    setEditId(plan.id);
    setEditDraft({ ...plan });
  };

  const saveEdit = async () => {
    if (!token || !editId) return;
    setSaving(true);
    try {
      const { id: _, createdAt: __, ...data } = editDraft as PremiumPlan;
      if (data.features && typeof data.features === "string") {
        data.features = (data.features as unknown as string).split(",").map((f) => f.trim()).filter(Boolean);
      }
      await api.admin.updatePremiumPlan(editId, data, token);
      setEditId(null);
      load();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Kaydedilemedi");
    } finally {
      setSaving(false);
    }
  };

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
      let featureList = features as string[];
      if (typeof features === "string") {
        featureList = (features as unknown as string).split(",").map((f) => f.trim()).filter(Boolean);
      }
      await api.admin.createPremiumPlan({
        name: name!,
        description: description ?? "",
        price: Number(price),
        durationDays: Number(durationDays),
        features: featureList ?? [],
        isActive: isActive !== false,
      }, token);
      setShowNew(false);
      setNewDraft({ isActive: true, features: [] });
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
            <Field label="Özellikler (virgülle)" value={Array.isArray(newDraft.features) ? newDraft.features.join(", ") : ""} onChange={(v) => setNewDraft({ ...newDraft, features: v.split(",").map((f) => f.trim()) })} />
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <button style={css.btnPrimary} onClick={createPlan} disabled={saving}>Oluştur</button>
            <button style={css.btnGhost} onClick={() => setShowNew(false)}>İptal</button>
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
                <Field label="Özellikler (virgülle)" value={Array.isArray(editDraft.features) ? editDraft.features.join(", ") : ""} onChange={(v) => setEditDraft({ ...editDraft, features: v.split(",").map((f) => f.trim()) })} />
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                <button style={css.btnPrimary} onClick={saveEdit} disabled={saving}>Kaydet</button>
                <button style={css.btnGhost} onClick={() => setEditId(null)}>İptal</button>
              </div>
            </>
          ) : (
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                  <span style={css.planName}>{plan.name}</span>
                  <span style={{ ...css.badge, background: plan.isActive ? "#DCFCE7" : "#F1F5F9", color: plan.isActive ? "#166534" : "#64748B" }}>
                    {plan.isActive ? "Aktif" : "Pasif"}
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
                <button style={{ ...css.btnSm, background: plan.isActive ? "#FEF2F2" : "#F0FDF4", color: plan.isActive ? "#DC2626" : "#166534" }} onClick={() => toggleActive(plan)}>
                  {plan.isActive ? "Pasifleştir" : "Aktifleştir"}
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
            {["Kullanıcı", "E-posta", "Rol", "Bakiye", "Premium", "Bitiş", "İşlem"].map((h) => (
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
                <td style={css.td}>{user.credits ?? 0} kr</td>
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
      <p style={css.subheading}>Premium planları düzenle, kullanıcılara premium ver veya kaldır.</p>

      <div style={css.tabs}>
        <button style={{ ...css.tab, ...(tab === "plans" ? css.tabActive : {}) }} onClick={() => setTab("plans")}>Planlar</button>
        <button style={{ ...css.tab, ...(tab === "users" ? css.tabActive : {}) }} onClick={() => setTab("users")}>Kullanıcılar</button>
      </div>

      {tab === "plans" ? <PlansTab /> : <UsersTab />}
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
  featureList: { display: "flex", flexWrap: "wrap" as const, gap: 6 },
  featureChip: { background: "#F1F5F9", color: "#475569", fontSize: 12, padding: "3px 8px", borderRadius: 12 },
  badge: { display: "inline-block", fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 8 },
  btnPrimary: { background: "#3B82F6", color: "#fff", border: "none", padding: "7px 14px", borderRadius: 6, fontSize: 13, cursor: "pointer", fontWeight: 500 },
  btnGhost: { background: "#F1F5F9", color: "#475569", border: "none", padding: "7px 14px", borderRadius: 6, fontSize: 13, cursor: "pointer" },
  btnSm: { background: "#F1F5F9", color: "#475569", border: "none", padding: "5px 10px", borderRadius: 6, fontSize: 12, cursor: "pointer", whiteSpace: "nowrap" as const },
  statsRow: { display: "flex", gap: 12, marginBottom: 16 },
  statBox: { background: "#fff", borderRadius: 10, padding: "14px 20px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)", flex: 1, textAlign: "center" as const },
  statNum: { fontSize: 28, fontWeight: 700, color: "#1E293B" },
  statLabel: { fontSize: 12, color: "#64748B", marginTop: 2 },
  searchInput: { width: "100%", padding: "8px 12px", border: "1px solid #CBD5E1", borderRadius: 8, fontSize: 13, marginBottom: 14, boxSizing: "border-box" as const },
  table: { width: "100%", borderCollapse: "collapse" as const, background: "#fff", borderRadius: 10, overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" },
  th: { padding: "10px 14px", fontSize: 12, fontWeight: 600, color: "#64748B", background: "#F8FAFC", textAlign: "left" as const, borderBottom: "1px solid #E2E8F0" },
  td: { padding: "10px 14px", fontSize: 13, color: "#1E293B", borderBottom: "1px solid #F1F5F9", verticalAlign: "middle" as const },
  select: { padding: "5px 8px", border: "1px solid #CBD5E1", borderRadius: 6, fontSize: 12 },
};
