import { useEffect, useRef, useState } from "react";
import { useAuth } from "../AuthContext";
import { api, Topic } from "../api";

const BASE = "http://localhost:3000/api";

export default function TopicsPage() {
  const { token } = useAuth();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [acting, setActing] = useState<string | null>(null);
  const [liveStatus, setLiveStatus] = useState<"connecting" | "live" | "offline">("connecting");
  const [rejectModal, setRejectModal] = useState<{ open: boolean; topicId: string; reason: string }>({
    open: false,
    topicId: "",
    reason: "",
  });
  const esRef = useRef<EventSource | null>(null);

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

  // SSE real-time connection
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
          // Topic was approved/rejected from another session
          const topicId = (payload as unknown as { topicId: string }).topicId;
          if (topicId) setTopics((prev) => prev.filter((t) => t.id !== topicId));
        }
      } catch (_) {}
    };

    return () => { es.close(); esRef.current = null; };
  }, [token]);

  useEffect(() => { load(); }, [token]);

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

  return (
    <div>
      <div style={css.header}>
        <h2 style={css.heading}>Konu Onay Kuyruğu</h2>
        <span style={css.badge}>{topics.length} bekleyen</span>
        <span style={{ ...css.liveChip, background: liveStatus === "live" ? "#D1FAE5" : liveStatus === "connecting" ? "#FEF9C3" : "#FEE2E2", color: liveStatus === "live" ? "#065F46" : liveStatus === "connecting" ? "#92400E" : "#991B1B" }}>
          {liveStatus === "live" ? "● Canlı" : liveStatus === "connecting" ? "○ Bağlanıyor" : "✕ Çevrimdışı"}
        </span>
        <button onClick={load} style={css.refreshBtn}>Yenile</button>
      </div>

      {error && <div style={css.error}>{error}</div>}

      {loading ? (
        <div style={css.loading}>Yükleniyor...</div>
      ) : topics.length === 0 ? (
        <div style={css.empty}>
          <div style={css.emptyIcon}>✅</div>
          <div>Onay bekleyen konu yok</div>
        </div>
      ) : (
        <div style={css.tableWrap}>
          <table>
            <thead>
              <tr>
                <th>Başlık</th>
                <th>Yazar</th>
                <th>Kategori</th>
                <th>Ülke</th>
                <th>Tarih</th>
                <th style={{ textAlign: "right" }}>İşlem</th>
              </tr>
            </thead>
            <tbody>
              {topics.map((t) => (
                <tr key={t.id}>
                  <td style={css.titleCell}>{t.title}</td>
                  <td style={css.mutedCell}>{t.authorDisplayName ?? t.authorId.slice(0, 8)}</td>
                  <td style={css.mutedCell}>{t.categoryName ?? t.categoryId.slice(0, 8)}</td>
                  <td style={css.mutedCell}>{t.countryName ?? "—"}</td>
                  <td style={css.mutedCell}>{new Date(t.createdAt).toLocaleDateString("tr-TR")}</td>
                  <td style={{ textAlign: "right" }}>
                    <button
                      style={css.approveBtn}
                      disabled={!!acting}
                      onClick={() => handleAction(t.id, "approved")}
                    >
                      {acting === t.id + "approved" ? "..." : "Onayla"}
                    </button>
                    <button
                      style={css.rejectBtn}
                      disabled={!!acting}
                      onClick={() => setRejectModal({ open: true, topicId: t.id, reason: "" })}
                    >
                      {acting === t.id + "rejected" ? "..." : "Reddet"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {rejectModal.open && (
        <div style={css.modalOverlay}>
          <div style={css.modalCard}>
            <h3 style={css.modalTitle}>Reddetme Sebebi</h3>
            <p style={css.modalDesc}>Bu konuyu neden reddediyorsunuz? (isteğe bağlı)</p>
            <textarea
              style={css.modalTextarea}
              placeholder="Örn: Konu kurallarımıza uygun değil..."
              value={rejectModal.reason}
              onChange={(e) => setRejectModal((prev) => ({ ...prev, reason: e.target.value }))}
              rows={4}
            />
            <div style={css.modalActions}>
              <button
                style={css.modalCancelBtn}
                onClick={() => setRejectModal({ open: false, topicId: "", reason: "" })}
              >
                İptal
              </button>
              <button style={css.modalConfirmBtn} onClick={handleConfirmReject}>
                Reddet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const css: Record<string, React.CSSProperties> = {
  header: { display: "flex", alignItems: "center", gap: 12, marginBottom: 24 },
  heading: { fontSize: 24, fontWeight: 700, color: "#1E293B" },
  badge: {
    background: "#FEF3C7",
    color: "#B45309",
    fontSize: 12,
    fontWeight: 600,
    padding: "3px 10px",
    borderRadius: 20,
  },
  liveChip: { fontSize: 12, fontWeight: 600, padding: "3px 10px", borderRadius: 20 },
  refreshBtn: { background: "#E2E8F0", color: "#374151", marginLeft: "auto" },
  error: { background: "#FEF2F2", color: "#DC2626", padding: "10px 14px", borderRadius: 8, fontSize: 13, marginBottom: 16 },
  loading: { color: "#64748B", padding: 32, textAlign: "center" },
  empty: { display: "flex", flexDirection: "column", alignItems: "center", padding: 48, color: "#64748B", gap: 8 },
  emptyIcon: { fontSize: 40 },
  tableWrap: { background: "#fff", borderRadius: 12, boxShadow: "0 1px 4px rgba(0,0,0,0.06)", overflow: "hidden" },
  titleCell: { fontWeight: 500, color: "#1E293B", maxWidth: 260 },
  mutedCell: { color: "#64748B", fontSize: 13 },
  approveBtn: {
    background: "#10B981",
    color: "#fff",
    padding: "6px 12px",
    fontSize: 13,
    borderRadius: 6,
    marginRight: 6,
  },
  rejectBtn: {
    background: "#EF4444",
    color: "#fff",
    padding: "6px 12px",
    fontSize: 13,
    borderRadius: 6,
  },
  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.45)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  },
  modalCard: {
    background: "#fff",
    borderRadius: 12,
    padding: 28,
    width: 440,
    maxWidth: "90vw",
    boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
  },
  modalTitle: { margin: "0 0 6px", fontSize: 18, fontWeight: 700, color: "#1E293B" },
  modalDesc: { margin: "0 0 14px", fontSize: 14, color: "#64748B" },
  modalTextarea: {
    width: "100%",
    border: "1px solid #CBD5E1",
    borderRadius: 8,
    padding: "10px 12px",
    fontSize: 14,
    resize: "vertical",
    outline: "none",
    fontFamily: "inherit",
    boxSizing: "border-box",
  },
  modalActions: { display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 16 },
  modalCancelBtn: {
    background: "#E2E8F0",
    color: "#374151",
    padding: "8px 18px",
    borderRadius: 6,
    fontSize: 14,
    border: "none",
    cursor: "pointer",
  },
  modalConfirmBtn: {
    background: "#EF4444",
    color: "#fff",
    padding: "8px 18px",
    borderRadius: 6,
    fontSize: 14,
    border: "none",
    cursor: "pointer",
  },
};
