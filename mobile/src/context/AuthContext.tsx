import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { api, ApiError, AuthUser, setOn401Handler } from "../services/api";

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: (idToken: string) => Promise<void>;
  register: (
    email: string,
    password: string,
    displayName: string,
    userType?: "emigrant" | "consultant" | "diaspora"
  ) => Promise<void>;
  logout: () => Promise<void>;
  /** Süresi dolmuş / geçersiz JWT nedeniyle otomatik çıkış yapar. */
  logoutOnUnauthorized: () => Promise<void>;
  /** Backend'den taze user bilgisini çeker (premium/credits stale olmasın diye). */
  refreshUser: () => Promise<AuthUser | null>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const TOKEN_KEY = "@goworldy_token";
const USER_KEY = "@goworldy_user";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isLoading: true,
  });

  useEffect(() => {
    (async () => {
      const [token, userJson] = await Promise.all([
        AsyncStorage.getItem(TOKEN_KEY),
        AsyncStorage.getItem(USER_KEY),
      ]);
      if (token && userJson) {
        // L-09: Token expire kontrolü — restore sırasında JWT payload'dan exp okur
        const isExpired = (() => {
          try {
            const payload = JSON.parse(atob(token.split(".")[1]));
            if (!payload.exp) return false;
            return Date.now() / 1000 > payload.exp;
          } catch {
            return false; // parse hatası → güvenli tarafta kal, API 401 ile handle eder
          }
        })();

        if (isExpired) {
          // Süresi dolmuş token — temizle, login ekranı göster
          await Promise.all([
            AsyncStorage.removeItem(TOKEN_KEY),
            AsyncStorage.removeItem(USER_KEY),
          ]);
          setState({ user: null, token: null, isLoading: false });
        } else {
          setState({ user: JSON.parse(userJson), token, isLoading: false });
        }
      } else {
        setState((s) => ({ ...s, isLoading: false }));
      }
    })();
  }, []);

  // SEC-01: Süresi dolmuş JWT → API 401 döndüğünde otomatik logout
  useEffect(() => {
    setOn401Handler(async () => {
      await Promise.all([
        AsyncStorage.removeItem(TOKEN_KEY),
        AsyncStorage.removeItem(USER_KEY),
      ]);
      setState({ user: null, token: null, isLoading: false });
    });
  }, []);

  const persist = async (user: AuthUser, token: string) => {
    await Promise.all([
      AsyncStorage.setItem(TOKEN_KEY, token),
      AsyncStorage.setItem(USER_KEY, JSON.stringify(user)),
    ]);
    setState({ user, token, isLoading: false });
  };

  const login = async (email: string, password: string) => {
    const { user, token } = await api.auth.login({ email, password });
    await persist(user, token);
  };

  const loginWithGoogle = async (idToken: string) => {
    const { user, token } = await api.auth.google(idToken);
    await persist(user, token);
  };

  const register = async (
    email: string,
    password: string,
    displayName: string,
    userType?: "emigrant" | "consultant" | "diaspora"
  ) => {
    const { user, token } = await api.auth.register({ email, password, displayName, userType });
    await persist(user, token);
  };

  const logout = async () => {
    await Promise.all([
      AsyncStorage.removeItem(TOKEN_KEY),
      AsyncStorage.removeItem(USER_KEY),
    ]);
    setState({ user: null, token: null, isLoading: false });
  };

  /**
   * SEC-01: Süresi dolmuş veya geçersiz JWT geldiğinde (401) çağrılır.
   * State'i temizler → navigator LoginScreen'e yönlendirir.
   */
  const logoutOnUnauthorized = async () => {
    await Promise.all([
      AsyncStorage.removeItem(TOKEN_KEY),
      AsyncStorage.removeItem(USER_KEY),
    ]);
    setState({ user: null, token: null, isLoading: false });
  };

  const refreshUser = useCallback(async (): Promise<AuthUser | null> => {
    const currentToken = state.token;
    if (!currentToken) return null;
    try {
      const fresh = await api.users.me(currentToken);
      const merged: AuthUser = {
        id: fresh.id,
        email: fresh.email,
        displayName: fresh.displayName,
        role: fresh.role as AuthUser["role"],
        userType: fresh.userType,
        isPremium: fresh.isPremium,
        premiumUntil: fresh.premiumUntil,
      };
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(merged));
      setState((s) => ({ ...s, user: merged }));
      return merged;
    } catch {
      return state.user;
    }
  }, [state.token, state.user]);

  return (
    <AuthContext.Provider value={{ ...state, login, loginWithGoogle, register, logout, logoutOnUnauthorized, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
