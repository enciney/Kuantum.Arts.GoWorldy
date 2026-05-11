import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../AuthContext";
import { api, DashboardStats } from "../api";

interface StatCard {
  label: string;
  value: number | null;
  color: string;
  icon: string;
}

export default function DashboardPage() {
  const { token } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    api.admin
      .dashboard(token)
      .then(setStats)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "Yüklenemedi."));
  }, [token]);

  const cards: StatCard[] = [
    { label: "Toplam Kullanıcı", value: stats?.totalUsers ?? null, color: "#3B82F6", icon: "👤" },
    { label: "Toplam Konu", value: stats?.totalTopics ?? null, color: "#10B981", icon: "💬" },
    { label: "Toplam Yorum", value: stats?.totalComments ?? null, color: "#F59E0B", icon: "✍️" },
    { label: "Ülke Sayısı", value: stats?.totalCountries ?? null, color: "#8B5CF6", icon: "🌍" },
  ];

  return (
    <div>
      <h2 style={css.heading}>Dashboard</h2>
      {error && <div style={css.error}>{error}</div>}
      <div style={css.grid}>
        {cards.map((c) => (
          <div key={c.label} style={{ ...css.card, borderTop: `4px solid ${c.color}` }}>
            <span style={css.cardIcon}>{c.icon}</span>
            <div style={{ ...css.cardValue, color: c.color }}>
              {c.value === null ? "—" : c.value.toLocaleString("tr-TR")}
            </div>
            <div style={css.cardLabel}>{c.label}</div>
          </div>
        ))}
      </div>

      <div style={css.infoBox}>
        <h3 style={css.subHeading}>Hızlı Bağlantılar</h3>
        <ul style={css.linkList}>
          <li>
            <Link to="/topics" style={{ color: "#3B82F6" }}>Konu Onay Kuyruğu →</Link>
          </li>
          <li>
            <Link to="/users" style={{ color: "#3B82F6" }}>Kullanıcı Yönetimi →</Link>
          </li>
        </ul>
      </div>
    </div>
  );
}

const css: Record<string, React.CSSProperties> = {
  heading: { fontSize: 24, fontWeight: 700, color: "#1E293B", marginBottom: 24 },
  subHeading: { fontSize: 16, fontWeight: 600, color: "#1E293B", marginBottom: 12 },
  error: { background: "#FEF2F2", color: "#DC2626", padding: "10px 14px", borderRadius: 8, fontSize: 13, marginBottom: 16 },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16, marginBottom: 32 },
  card: {
    background: "#fff",
    borderRadius: 12,
    padding: "20px 24px",
    boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },
  cardIcon: { fontSize: 28, marginBottom: 4 },
  cardValue: { fontSize: 32, fontWeight: 700, lineHeight: 1.2 },
  cardLabel: { fontSize: 13, color: "#64748B" },
  infoBox: {
    background: "#fff",
    borderRadius: 12,
    padding: "20px 24px",
    boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
  },
  linkList: { listStyle: "none", display: "flex", flexDirection: "column", gap: 8 },
};
