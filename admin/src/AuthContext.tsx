import { createContext, useContext, useState, ReactNode } from "react";
import { User } from "./api";

interface AuthCtx {
  token: string | null;
  user: User | null;
  login: (token: string, user: User) => void;
  logout: () => void;
}

const Ctx = createContext<AuthCtx>({} as AuthCtx);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("admin_token"));
  const [user, setUser] = useState<User | null>(() => {
    const s = localStorage.getItem("admin_user");
    return s ? (JSON.parse(s) as User) : null;
  });

  const login = (t: string, u: User) => {
    localStorage.setItem("admin_token", t);
    localStorage.setItem("admin_user", JSON.stringify(u));
    setToken(t);
    setUser(u);
  };

  const logout = () => {
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_user");
    setToken(null);
    setUser(null);
  };

  return <Ctx.Provider value={{ token, user, login, logout }}>{children}</Ctx.Provider>;
}

export const useAuth = () => useContext(Ctx);
