import { useEffect, useState } from "react";
import { useAuth } from "../AuthContext";
import { api, AdminConfig } from "../api";

function Row({ label, value }: { label: string; value: string | number | boolean }) {
  const isBool = typeof value === "boolean";
  const display = isBool
    ? (value ? "✅ Yapılandırıldı" : "❌ Yapılandırılmadı")
    : String(value);
  return (
    <tr>
      <td style={css.rowLabel}>{label}</td>
      <td style={css.rowValue}>{display}</td>
    </tr>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={css.section}>
      <h3 style={css.sectionTitle}>{title}</h3>
      <table style={css.table}>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

export default function ConfigPage() {
  const { token } = useAuth();
  const [cfg, setCfg] = useState<AdminConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    api.admin.config(token)
      .then(setCfg)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "Yüklenemedi."))
      .finally(() => setLoading(false));
  }, [token]);

  return (
    <div>
      <h2 style={css.heading}>Sistem Yapılandırması</h2>
      <p style={css.subheading}>
        Uygulamanın ayağa kalkması için gereken kritik yapılandırma değerleri (salt okunur).
        Forum fiyatları, premium paketler ve özellik bayrakları için{" "}
        <a href="/settings" style={{ color: "#2563EB" }}>Ayarlar</a> sayfasını kullanın.
      </p>

      {error && <div style={css.error}>{error}</div>}

      {loading ? (
        <div style={css.loading}>Yükleniyor...</div>
      ) : cfg ? (
        <>
          <Section title="Uygulama">
            <Row label="Ad" value={cfg.app.name} />
            <Row label="Sürüm" value={cfg.app.version} />
            <Row label="URL" value={cfg.app.url} />
          </Section>

          <Section title="Sunucu">
            <Row label="Port" value={cfg.server.port} />
            <Row label="Ortam" value={cfg.server.nodeEnv} />
            <Row label="JWT Süresi" value={cfg.server.jwtExpiry} />
          </Section>

          <Section title="Yönetici">
            <Row label="Admin E-posta" value={cfg.admin.email} />
          </Section>

          <Section title="Entegrasyonlar">
            <Row label="Firebase (Google Auth)" value={cfg.integrations.firebaseConfigured} />
            <Row label="Stripe (Ödeme)" value={cfg.integrations.stripeConfigured} />
            <Row label="SendGrid (E-posta)" value={cfg.integrations.sendgridConfigured} />
            <Row label="Google OAuth" value={cfg.integrations.googleAuthConfigured} />
          </Section>
        </>
      ) : null}
    </div>
  );
}

const css: Record<string, React.CSSProperties> = {
  heading: { fontSize: 24, fontWeight: 700, color: "#1E293B", marginBottom: 4 },
  subheading: { fontSize: 13, color: "#64748B", marginBottom: 28 },
  error: { background: "#FEF2F2", color: "#DC2626", padding: "10px 14px", borderRadius: 8, fontSize: 13, marginBottom: 16 },
  loading: { color: "#64748B", padding: 32, textAlign: "center" },
  section: {
    background: "#fff",
    borderRadius: 12,
    boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
    padding: "20px 24px",
    marginBottom: 20,
  },
  sectionTitle: { fontSize: 15, fontWeight: 700, color: "#1E293B", marginBottom: 14, marginTop: 0 },
  table: { width: "100%", borderCollapse: "collapse" },
  rowLabel: {
    padding: "9px 0",
    fontSize: 13,
    color: "#64748B",
    borderBottom: "1px solid #F1F5F9",
    width: "50%",
  },
  rowValue: {
    padding: "9px 0",
    fontSize: 13,
    fontWeight: 500,
    color: "#1E293B",
    borderBottom: "1px solid #F1F5F9",
    textAlign: "right",
  },
};
