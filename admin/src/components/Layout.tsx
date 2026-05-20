import { ReactNode } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";

const NAV: { to: string; label: string }[] = [
  { to: "/", label: "Dashboard" },
  { to: "/topics", label: "Forum Moderasyonu" },
  { to: "/users", label: "Kullanıcılar" },
  { to: "/premium", label: "Premium" },
  { to: "/settings", label: "Ayarlar" },
  { to: "/config", label: "Config (Salt-okunur)" },
];

export default function Layout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div style={css.root}>
      <aside style={css.sidebar}>
        <div style={css.brand}>
          <span style={css.brandIcon}>🌍</span>
          <span style={css.brandName}>GoWorldy</span>
          <span style={css.brandBadge}>Admin</span>
        </div>
        <nav style={css.nav}>
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.to === "/"}
              style={({ isActive }) => ({ ...css.navItem, ...(isActive ? css.navActive : {}) })}
            >
              {n.label}
            </NavLink>
          ))}
        </nav>
        <div style={css.sidebarFooter}>
          <span style={css.sidebarUser}>{user?.displayName ?? user?.email}</span>
          <button style={css.logoutBtn} onClick={handleLogout}>Çıkış</button>
        </div>
      </aside>
      <main style={css.main}>{children}</main>
    </div>
  );
}

const css: Record<string, React.CSSProperties> = {
  root: { display: "flex", minHeight: "100vh" },
  sidebar: {
    width: 220,
    background: "#1E293B",
    display: "flex",
    flexDirection: "column",
    padding: "24px 0",
    flexShrink: 0,
  },
  brand: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "0 20px 24px",
    borderBottom: "1px solid #334155",
  },
  brandIcon: { fontSize: 22 },
  brandName: { color: "#F8FAFC", fontWeight: 700, fontSize: 16 },
  brandBadge: {
    background: "#3B82F6",
    color: "#fff",
    fontSize: 10,
    fontWeight: 700,
    padding: "2px 6px",
    borderRadius: 4,
    marginLeft: 2,
  },
  nav: { flex: 1, padding: "16px 12px", display: "flex", flexDirection: "column", gap: 4 },
  navItem: {
    display: "block",
    padding: "10px 12px",
    borderRadius: 8,
    color: "#94A3B8",
    fontWeight: 500,
    fontSize: 14,
    transition: "background 0.15s",
  },
  navActive: { background: "#3B82F6", color: "#fff" },
  sidebarFooter: {
    padding: "16px 20px 0",
    borderTop: "1px solid #334155",
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  sidebarUser: { fontSize: 13, color: "#94A3B8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  logoutBtn: { background: "#EF4444", color: "#fff", padding: "7px 12px", fontSize: 13, borderRadius: 6, cursor: "pointer", border: "none" },
  main: { flex: 1, padding: "32px", overflowY: "auto" },
};
