import { useEffect, useState } from "react";
import { useAuth } from "../AuthContext";
import { api, User } from "../api";

const ROLES = ["user", "moderator", "admin"] as const;
type Role = (typeof ROLES)[number];

const ROLE_LABELS: Record<Role, string> = { user: "Üye", moderator: "Moderatör", admin: "Admin" };
const ROLE_COLORS: Record<Role, string> = { user: "#6B7280", moderator: "#F59E0B", admin: "#3B82F6" };

const USER_TYPE_LABELS: Record<string, string> = {
  emigrant: "Göç Etmek İstiyorum",
  consultant: "Danışman",
  diaspora: "Yurt Dışındayım",
};

export default function UsersPage() {
  const { token, user: me } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [filtered, setFiltered] = useState<User[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    api.admin
      .users(token)
      .then((data) => {
        setUsers(data);
        setFiltered(data);
      })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "Yüklenemedi."))
      .finally(() => setLoading(false));
  }, [token]);

  const handleSearch = (q: string) => {
    setSearch(q);
    const lower = q.toLowerCase();
    setFiltered(
      users.filter(
        (u) =>
          u.displayName.toLowerCase().includes(lower) ||
          u.email.toLowerCase().includes(lower)
      )
    );
  };

  const handleRoleChange = async (id: string, role: Role) => {
    if (!token) return;
    setUpdatingId(id);
    try {
      await api.admin.updateUserRole(id, role, token);
      const update = (list: User[]) =>
        list.map((u) => (u.id === id ? { ...u, role } : u));
      setUsers(update);
      setFiltered(update);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Güncelleme başarısız.");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div>
      <div style={css.header}>
        <h2 style={css.heading}>Kullanıcılar</h2>
        <input
          type="text"
          placeholder="İsim veya e-posta ara..."
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          style={css.searchInput}
        />
      </div>

      {error && <div style={css.error}>{error}</div>}

      {loading ? (
        <div style={css.loading}>Yükleniyor...</div>
      ) : (
        <div style={css.tableWrap}>
          <table>
            <thead>
              <tr>
                <th>Kullanıcı</th>
                <th>Tür</th>
                <th>Kredi</th>
                <th>Premium</th>
                <th>Kayıt</th>
                <th>Rol</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id}>
                  <td>
                    <div style={css.userCell}>
                      <div style={css.avatar}>{u.displayName[0]?.toUpperCase()}</div>
                      <div>
                        <div style={css.userName}>{u.displayName}</div>
                        <div style={css.userEmail}>{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td style={css.mutedCell}>{u.userType ? (USER_TYPE_LABELS[u.userType] ?? u.userType) : "—"}</td>
                  <td style={css.mutedCell}>{u.credits ?? 0}</td>
                  <td style={css.mutedCell}>{u.isPremium ? "✅" : "—"}</td>
                  <td style={css.mutedCell}>
                    {u.createdAt ? new Date(u.createdAt).toLocaleDateString("tr-TR") : "—"}
                  </td>
                  <td>
                    <select
                      value={u.role}
                      disabled={updatingId === u.id || u.id === me?.id}
                      onChange={(e) => handleRoleChange(u.id, e.target.value as Role)}
                      style={{ ...css.select, color: ROLE_COLORS[u.role] }}
                    >
                      {ROLES.map((r) => (
                        <option key={r} value={r} style={{ color: ROLE_COLORS[r] }}>
                          {ROLE_LABELS[r]}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div style={css.empty}>Kullanıcı bulunamadı.</div>
          )}
        </div>
      )}
    </div>
  );
}

const css: Record<string, React.CSSProperties> = {
  header: { display: "flex", alignItems: "center", gap: 16, marginBottom: 24 },
  heading: { fontSize: 24, fontWeight: 700, color: "#1E293B" },
  searchInput: { marginLeft: "auto", width: 260, padding: "9px 14px" },
  error: { background: "#FEF2F2", color: "#DC2626", padding: "10px 14px", borderRadius: 8, fontSize: 13, marginBottom: 16 },
  loading: { color: "#64748B", padding: 32, textAlign: "center" },
  tableWrap: { background: "#fff", borderRadius: 12, boxShadow: "0 1px 4px rgba(0,0,0,0.06)", overflow: "hidden" },
  userCell: { display: "flex", alignItems: "center", gap: 10 },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: "50%",
    background: "#DBEAFE",
    color: "#1D4ED8",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 700,
    fontSize: 14,
    flexShrink: 0,
  },
  userName: { fontWeight: 500, color: "#1E293B", fontSize: 14 },
  userEmail: { fontSize: 12, color: "#94A3B8" },
  mutedCell: { color: "#64748B", fontSize: 13 },
  select: { border: "1px solid #E2E8F0", borderRadius: 6, padding: "5px 8px", fontSize: 13, fontWeight: 500, background: "#F8FAFC", cursor: "pointer" },
  empty: { color: "#64748B", textAlign: "center", padding: 32 },
};
