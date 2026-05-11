import { useState, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../AuthContext";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("admin@goworldy.com");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { token, user } = await api.auth.login(email, password);
      if (user.role !== "admin" && user.role !== "moderator") {
        setError("Bu hesabın admin paneline erişim yetkisi yok.");
        return;
      }
      login(token, user);
      navigate("/");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Giriş başarısız.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={css.page}>
      <div style={css.card}>
        <div style={css.logo}>🌍</div>
        <h1 style={css.title}>GoWorldy Admin</h1>
        <p style={css.subtitle}>Yönetici paneline giriş yapın</p>

        {error && <div style={css.error}>{error}</div>}

        <form onSubmit={handleSubmit} style={css.form}>
          <label style={css.label}>E-posta</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={css.input}
            placeholder="admin@goworldy.com"
          />
          <label style={css.label}>Şifre</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={css.input}
            placeholder="••••••••"
          />
          <button type="submit" disabled={loading} style={css.btn}>
            {loading ? "Giriş yapılıyor..." : "Giriş Yap"}
          </button>
        </form>
      </div>
    </div>
  );
}

const css: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#F1F5F9",
  },
  card: {
    background: "#fff",
    borderRadius: 16,
    padding: "40px 36px",
    width: "100%",
    maxWidth: 380,
    boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
    textAlign: "center",
  },
  logo: { fontSize: 48, marginBottom: 8 },
  title: { fontSize: 22, fontWeight: 700, color: "#1E293B", marginBottom: 4 },
  subtitle: { fontSize: 14, color: "#64748B", marginBottom: 24 },
  error: {
    background: "#FEF2F2",
    color: "#DC2626",
    padding: "10px 14px",
    borderRadius: 8,
    fontSize: 13,
    marginBottom: 16,
    textAlign: "left",
  },
  form: { display: "flex", flexDirection: "column", gap: 8, textAlign: "left" },
  label: { fontSize: 13, fontWeight: 500, color: "#374151", marginBottom: 2, marginTop: 8 },
  input: {
    width: "100%",
    padding: "10px 14px",
    fontSize: 15,
    border: "1px solid #D1D5DB",
    borderRadius: 8,
    outline: "none",
    boxSizing: "border-box",
  },
  btn: {
    background: "#3B82F6",
    color: "#fff",
    padding: "12px",
    fontSize: 15,
    fontWeight: 600,
    borderRadius: 10,
    marginTop: 16,
    width: "100%",
    border: "none",
    cursor: "pointer",
  },
};
