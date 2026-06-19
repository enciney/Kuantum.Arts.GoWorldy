import { useEffect, useRef, useState } from "react";
import { useAuth } from "../AuthContext";
import { api, Topic, DeletionRequest, EditRequest } from "../api";

const BASE = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

type Tab = "pending" | "editRequests" | "deletionRequests";

export default function TopicsPage() {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("pending");

  // ── Pending topics ─────────────────────────────────────────────────────────
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [acting, setActing] = useState<string | null>(null);
  const [liveStatus, setLiveStatus] = useState<"connecting" | "live" | "offline">("connecting");
  const [rejectModal, setRejectModal] = useState<{ open: boolean; topicId: string; reason: string }>({
    open: false, topicId: "", reason: "",
  });
  const esRef = useRef<EventSource | null>(null);

  // ── Edit requests ──────────────────────────────────────────────────────────
  const [editReqs, setEditReqs] = useState<EditRequest[]>([]);
  const [editLoading, setEditLoading] = useState(false);
  const [editActing, setEditActing] = useState<string | null>(null);
  const [editRejectModal, setEditRejectModal] = useState<{ open: boolean; id: string; reason: string }>({
    open: false, id: "", reason: "",
  });

  // ── Deletion requests ──────────────────────────────────────────────────────
  const [delReqs, setDelReqs] = useState<DeletionRequest[]>([]);
  const [delLoading, setDelLoading] = useState(false);
  const [delActing, setDelActing] = useState<string | null>(null);
  const [delRejectModal, setDelRejectModal] = useState<{ open: boolean; id: string; reason: string }>({
    open: false, id: "", reason: "",
  });

  const load = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await api.admin.pendingTopics(token);
      setTopics(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Yüklenemedi.");
    } finally {
      setLoading(false);
    }
  };

  const loadEditReqs = async () => {
    if (!token) return;
    setEditLoading(true);
    try {
      setEditReqs(await api.forum.getEditRequests(token));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Yüklenemedi.");
    } finally {
      setEditLoading(false);
    }
  };

  const loadDelReqs = async () => {
    if (!token) return;
    setDelLoading(true);
    try {
      setDelReqs(await api.forum.getDeletionRequests(token));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Yüklenemedi.");
    } finally {
      setDelLoading(false);
    }
  };

  // SSE real-time connection for pending topics
  useEffect(() => {
    if (!token) return;
    const es = new EventSource(`${BASE}/admin/topics/stream?token=${encodeURIComponent(token)}`);
    esRef.current = es;
    setLiveStatus("connecting");
    es.onopen = () => setLiveStatus("live");
    es.onerror = () => setLiveStatus("offline");
    es.onmessage = (e) => {
      try {
        const payload = JSON.parse(e.data) as { type: string; topic?: Topic; topics?: Topic[] };
        if (payload.type === "init" && payload.topics) {
          setTopics(payload.topics);
          setLoading(false);
          setLiveStatus("live");
        } else if (payload.type === "new_pending" && payload.topic) {
          setTopics((prev) => {
            if (prev.find((t) => t.id === payload.topic!.id)) return prev;
            return [payload.topic!, ...prev];
          });
        } else if (payload.type === "removed") {
          const topicId = (payload as unknown as { topicId: string }).topicId;
          if (topicId) setTopics((prev) => prev.filter((t) => t.id !== topicId));
        }
      } catch (_) {}
    };
    return () => { es.close(); esRef.current = null; };
  }, [token]);

  useEffect(() => { load(); }, [token]);

  useEffect(() => {
    if (activeTab === "editRequests") loadEditReqs();
    if (activeTab === "deletionRequests") loadDelReqs();
  }, [activeTab, token]);

  // ── Pending topic actions ──────────────────────────────────────────────────
  const handleAction = async (id: string, action: "approved" | "rejected", reason?: string) => {
    if (!token) return;
    setActing(id + action);
    try {
      await api.forum.updateTopicStatus(id, action, token, reason);
      setTopics((prev) => prev.filter((t) => t.id !== id));
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "İşlem başarısız.");
    } finally {
      setActing(null);
    }
  };

  const handleConfirmReject = () => {
    const { topicId, reason } = rejectModal;
    setRejectModal({ open: false, topicId: "", reason: "" });
    handleAction(topicId, "rejected", reason || undefined);
  };

  // ── Edit request actions ───────────────────────────────────────────────────
  const handleEditAction = async (id: string, status: "approved" | "rejected", rejectionReason?: string) => {
    if (!token) return;
    setEditActing(id + status);
    try {
      await api.forum.resolveEditRequest(id, status, token, rejectionReason);
      setEditReqs((prev) => prev.filter((r) => r.id !== id));
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "İşlem başarısız.");
    } finally {
      setEditActing(null);
    }
  };

  const handleConfirmEditReject = () => {
    const { id, reason } = editRejectModal;
    setEditRejectModal({ open: false, id: "", reason: "" });
    handleEditAction(id, "rejected", reason);
  };

  // ── Deletion request actions ───────────────────────────────────────────────
  const handleDelAction = async (id: string, status: "approved" | "rejected", rejectionReason?: string) => {
    if (!token) return;
    setDelActing(id + status);
    try {
      await api.forum.resolveDeletionRequest(id, status, token, rejectionReason);
      setDelReqs((prev) => prev.filter((r) => r.id !== id));
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "İşlem başarısız.");
    } finally {
      setDelActing(null);
    }
  };

  const handleConfirmDelReject = () => {
    const { id, reason } = delRejectModal;
    setDelRejectModal({ open: false, id: "", reason: "" });
    handleDelAction(id, "rejected", reason);
  };

  const tabLabel = (t: Tab) => {
    if (t === "pending") return `Bekleyen Konular${topics.length > 0 ? ` (${topics.length})` : ""}`;
    if (t === "editRequests") return `Düzenleme Talepleri${editReqs.length > 0 ? ` (${editReqs.length})` : ""}`;
    return `Silme Talepleri${delReqs.length > 0 ? ` (${delReqs.length})` : ""}`;
  };

  return (
    <div>
      <div style={css.pageHeader}>
        <h2 style={css.heading}>Forum Moderasyonu</h2>
        {activeTab === "pending" && (
          <span style={{ ...css.liveChip, background: liveStatus === "live" ? "#D1FAE5" : liveStatus === "connecting" ? "#FEF9C3" : "#FEE2E2", color: liveStatus === "live" ? "#065F46" : liveStatus === "connecting" ? "#92400E" : "#991B1B" }}>
            {liveStatus === "live" ? "● Canlı" : liveStatus === "connecting" ? "○ Bağlanıyor" : "✕ Çevrimdışı"}
          </span>
        )}
        <button onClick={() => {
          if (activeTab === "pending") load();
          if (activeTab === "editRequests") loadEditReqs();
          if (activeTab === "deletionRequests") loadDelReqs();
        }} style={css.refreshBtn}>Yenile</button>
      </div>

      {/* Tabs */}
      <div style={css.tabs}>
        {(["pending", "editRequests", "deletionRequests"] as Tab[]).map((t) => (
          <button
            key={t}
            style={{ ...css.tab, ...(activeTab === t ? css.tabActive : {}) }}
            onClick={() => setActiveTab(t)}
          >
            {tabLabel(t)}
          </button>
        ))}
      </div>

      {error && <div style={css.error}>{error}</div>}

      {/* ── Bekleyen Konular ──────────────────────────────────────────────── */}
      {activeTab === "pending" && (
        loading ? <div style={css.loading}>Yükleniyor...</div> :
        topics.length === 0 ? (
          <div style={css.empty}><div style={css.emptyIcon}>✅</div><div>Onay bekleyen konu yok</div></div>
        ) : (
          <div style={css.tableWrap}>
            <table>
              <thead><tr>
                <th>Başlık</th><th>Yazar</th><th>Kategori</th><th>Ülke</th><th>Tarih</th><th style={{ textAlign: "right" }}>İşlem</th>
              </tr></thead>
              <tbody>
                {topics.map((t) => (
                  <tr key={t.id}>
                    <td style={css.titleCell}>{t.title}</td>
                    <td style={css.mutedCell}>{t.authorDisplayName ?? t.authorId.slice(0, 8)}</td>
                    <td style={css.mutedCell}>{t.categoryName ?? t.categoryId.slice(0, 8)}</td>
                    <td style={css.mutedCell}>{t.countryName ?? "—"}</td>
                    <td style={css.mutedCell}>{new Date(t.createdAt).toLocaleDateString("tr-TR")}</td>
                    <td style={{ textAlign: "right" }}>
                      <button style={css.approveBtn} disabled={!!acting} onClick={() => handleAction(t.id, "approved")}>
                        {acting === t.id + "approved" ? "..." : "Onayla"}
                      </button>
                      <button style={css.rejectBtn} disabled={!!acting} onClick={() => setRejectModal({ open: true, topicId: t.id, reason: "" })}>
                        {acting === t.id + "rejected" ? "..." : "Reddet"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {/* ── Düzenleme Talepleri ────────────────────────────────────────────── */}
      {activeTab === "editRequests" && (
        editLoading ? <div style={css.loading}>Yükleniyor...</div> :
        editReqs.length === 0 ? (
          <div style={css.empty}><div style={css.emptyIcon}>✏️</div><div>Bekleyen düzenleme talebi yok</div></div>
        ) : (
          <div style={css.tableWrap}>
            <table>
              <thead><tr>
                <th>Mevcut Başlık</th><th>Yeni Başlık</th><th>Sahibi</th><th>Tarih</th><th style={{ textAlign: "right" }}>İşlem</th>
              </tr></thead>
              <tbody>
                {editReqs.map((r) => (
                  <tr key={r.id}>
                    <td style={css.mutedCell}>{r.topicTitle}</td>
                    <td style={css.titleCell}>{r.newTitle}</td>
                    <td style={css.mutedCell}>{r.requesterName}</td>
                    <td style={css.mutedCell}>{new Date(r.createdAt).toLocaleDateString("tr-TR")}</td>
                    <td style={{ textAlign: "right" }}>
                      <button style={css.approveBtn} disabled={!!editActing} onClick={() => handleEditAction(r.id, "approved")}>
                        {editActing === r.id + "approved" ? "..." : "Onayla"}
                      </button>
                      <button style={css.rejectBtn} disabled={!!editActing} onClick={() => setEditRejectModal({ open: true, id: r.id, reason: "" })}>
                        {editActing === r.id + "rejected" ? "..." : "Reddet"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {/* ── Silme Talepleri ────────────────────────────────────────────────── */}
      {activeTab === "deletionRequests" && (
        delLoading ? <div style={css.loading}>Yükleniyor...</div> :
        delReqs.length === 0 ? (
          <div style={css.empty}><div style={css.emptyIcon}>🗑️</div><div>Bekleyen silme talebi yok</div></div>
        ) : (
          <div style={css.tableWrap}>
            <table>
              <thead><tr>
                <th>Konu</th><th>Sahibi</th><th>Sebep</th><th>Tarih</th><th style={{ textAlign: "right" }}>İşlem</th>
              </tr></thead>
              <tbody>
                {delReqs.map((r) => (
                  <tr key={r.id}>
                    <td style={css.titleCell}>{r.topicTitle}</td>
                    <td style={css.mutedCell}>{r.requesterName}</td>
                    <td style={css.mutedCell}>{r.reason}</td>
                    <td style={css.mutedCell}>{new Date(r.createdAt).toLocaleDateString("tr-TR")}</td>
                    <td style={{ textAlign: "right" }}>
                      <button style={css.approveBtn} disabled={!!delActing} onClick={() => handleDelAction(r.id, "approved")}>
                        {delActing === r.id + "approved" ? "..." : "Sil"}
                      </button>
                      <button style={css.rejectBtn} disabled={!!delActing} onClick={() => setDelRejectModal({ open: true, id: r.id, reason: "" })}>
                        {delActing === r.id + "rejected" ? "..." : "Reddet"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {/* Reject modals */}
      {rejectModal.open && (
        <RejectModal
          title="Konuyu Reddet"
          desc="Bu konuyu neden reddediyorsunuz?"
          reason={rejectModal.reason}
          onReasonChange={(r) => setRejectModal((p) => ({ ...p, reason: r }))}
          onCancel={() => setRejectModal({ open: false, topicId: "", reason: "" })}
          onConfirm={handleConfirmReject}
          label="Reddet"
        />
      )}
      {editRejectModal.open && (
        <RejectModal
          title="Düzenleme Talebini Reddet"
          desc="Bu düzenleme talebini neden reddediyorsunuz? (en az 5 karakter)"
          reason={editRejectModal.reason}
          onReasonChange={(r) => setEditRejectModal((p) => ({ ...p, reason: r }))}
          onCancel={() => setEditRejectModal({ open: false, id: "", reason: "" })}
          onConfirm={handleConfirmEditReject}
          label="Reddet"
        />
      )}
      {delRejectModal.open && (
        <RejectModal
          title="Silme Talebini Reddet"
          desc="Bu silme talebini neden reddediyorsunuz? (en az 5 karakter)"
          reason={delRejectModal.reason}
          onReasonChange={(r) => setDelRejectModal((p) => ({ ...p, reason: r }))}
          onCancel={() => setDelRejectModal({ open: false, id: "", reason: "" })}
          onConfirm={handleConfirmDelReject}
          label="Reddet"
        />
      )}
    </div>
  );
}

function RejectModal({ title, desc, reason, onReasonChange, onCancel, onConfirm, label }: {
  title: string; desc: string; reason: string;
  onReasonChange: (r: string) => void;
  onCancel: () => void; onConfirm: () => void; label: string;
}) {
  return (
    <div style={css.modalOverlay}>
      <div style={css.modalCard}>
        <h3 style={css.modalTitle}>{title}</h3>
        <p style={css.modalDesc}>{desc}</p>
        <textarea
          style={css.modalTextarea}
          placeholder="Sebep girin..."
          value={reason}
          onChange={(e) => onReasonChange(e.target.value)}
          rows={4}
        />
        <div style={css.modalActions}>
          <button style={css.modalCancelBtn} onClick={onCancel}>İptal</button>
          <button style={css.modalConfirmBtn} onClick={onConfirm}>{label}</button>
        </div>
      </div>
    </div>
  );
}

const css: Record<string, React.CSSProperties> = {
  pageHeader: { display: "flex", alignItems: "center", gap: 12, marginBottom: 16 },
  heading: { fontSize: 24, fontWeight: 700, color: "#1E293B", margin: 0 },
  liveChip: { fontSize: 12, fontWeight: 600, padding: "3px 10px", borderRadius: 20 },
  refreshBtn: { background: "#E2E8F0", color: "#374151", marginLeft: "auto", padding: "6px 14px", borderRadius: 6, border: "none", cursor: "pointer", fontSize: 13 },
  tabs: { display: "flex", gap: 4, marginBottom: 20, borderBottom: "2px solid #E2E8F0", paddingBottom: 0 },
  tab: { padding: "10px 18px", fontSize: 14, fontWeight: 500, color: "#64748B", background: "none", border: "none", cursor: "pointer", borderBottom: "2px solid transparent", marginBottom: -2 },
  tabActive: { color: "#3B82F6", borderBottom: "2px solid #3B82F6", fontWeight: 700 },
  error: { background: "#FEF2F2", color: "#DC2626", padding: "10px 14px", borderRadius: 8, fontSize: 13, marginBottom: 16 },
  loading: { color: "#64748B", padding: 32, textAlign: "center" },
  empty: { display: "flex", flexDirection: "column", alignItems: "center", padding: 48, color: "#64748B", gap: 8 },
  emptyIcon: { fontSize: 40 },
  tableWrap: { background: "#fff", borderRadius: 12, boxShadow: "0 1px 4px rgba(0,0,0,0.06)", overflow: "hidden" },
  titleCell: { fontWeight: 500, color: "#1E293B", maxWidth: 260 },
  mutedCell: { color: "#64748B", fontSize: 13 },
  approveBtn: { background: "#10B981", color: "#fff", padding: "6px 12px", fontSize: 13, borderRadius: 6, marginRight: 6, border: "none", cursor: "pointer" },
  rejectBtn: { background: "#EF4444", color: "#fff", padding: "6px 12px", fontSize: 13, borderRadius: 6, border: "none", cursor: "pointer" },
  modalOverlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 },
  modalCard: { background: "#fff", borderRadius: 12, padding: 28, width: 440, maxWidth: "90vw", boxShadow: "0 8px 32px rgba(0,0,0,0.18)" },
  modalTitle: { margin: "0 0 6px", fontSize: 18, fontWeight: 700, color: "#1E293B" },
  modalDesc: { margin: "0 0 14px", fontSize: 14, color: "#64748B" },
  modalTextarea: { width: "100%", border: "1px solid #CBD5E1", borderRadius: 8, padding: "10px 12px", fontSize: 14, resize: "vertical", outline: "none", fontFamily: "inherit", boxSizing: "border-box" },
  modalActions: { display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 16 },
  modalCancelBtn: { background: "#E2E8F0", color: "#374151", padding: "8px 18px", borderRadius: 6, fontSize: 14, border: "none", cursor: "pointer" },
  modalConfirmBtn: { background: "#EF4444", color: "#fff", padding: "8px 18px", borderRadius: 6, fontSize: 14, border: "none", cursor: "pointer" },
};
