import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { api, ApiError, AuthUser, setOn401Handler } from "../services/api";

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
}

interface AuthContextValue extends AuthState {
  needsOnboarding: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: (idToken: string) => Promise<void>;
  register: (
    email: string,
    password: string,
    displayName: string,
    userType?: "emigrant" | "consultant" | "diaspora"
  ) => Promise<void>;
  completeOnboarding: () => void;
  logout: () => Promise<void>;
  logoutOnUnauthorized: () => Promise<void>;
  refreshUser: () => Promise<AuthUser | null>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const TOKEN_KEY = "@goworldy_token";
const USER_KEY = "@goworldy_user";
const REFRESH_TOKEN_KEY = "@goworldy_refresh_token";

function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    if (!payload.exp) return false;
    return Date.now() / 1000 > payload.exp;
  } catch {
    return false;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isLoading: true,
  });
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  const refreshingRef = useRef(false);

  const clearStorage = async () => {
    await Promise.all([
      AsyncStorage.removeItem(TOKEN_KEY),
      AsyncStorage.removeItem(USER_KEY),
      AsyncStorage.removeItem(REFRESH_TOKEN_KEY),
    ]);
  };

  useEffect(() => {
    (async () => {
      const [token, userJson, refreshToken] = await Promise.all([
        AsyncStorage.getItem(TOKEN_KEY),
        AsyncStorage.getItem(USER_KEY),
        AsyncStorage.getItem(REFRESH_TOKEN_KEY),
      ]);

      if (token && userJson) {
        if (isTokenExpired(token)) {
          if (refreshToken) {
            try {
              const result = await api.auth.refresh(refreshToken);
              await AsyncStorage.setItem(TOKEN_KEY, result.token);
              await AsyncStorage.setItem(REFRESH_TOKEN_KEY, result.refreshToken);
              const restoredUser: AuthUser = JSON.parse(userJson);
              setState({ user: restoredUser, token: result.token, isLoading: false });
              api.users.me(result.token).then((fresh) => {
                const merged: AuthUser = {
                  id: fresh.id,
                  email: fresh.email,
                  displayName: fresh.displayName,
                  role: fresh.role as AuthUser["role"],
                  userType: fresh.userType,
                  credits: fresh.credits,
                  isPremium: fresh.isPremium,
                  premiumUntil: fresh.premiumUntil,
                };
                AsyncStorage.setItem(USER_KEY, JSON.stringify(merged)).catch(() => {});
                setState((s) => ({ ...s, user: merged }));
              }).catch(() => {});
              return;
            } catch {
              await clearStorage();
              setState({ user: null, token: null, isLoading: false });
              return;
            }
          }
          await clearStorage();
          setState({ user: null, token: null, isLoading: false });
        } else {
          const restoredUser: AuthUser = JSON.parse(userJson);
          setState({ user: restoredUser, token, isLoading: false });
          api.users.me(token).then((fresh) => {
            const merged: AuthUser = {
              id: fresh.id,
              email: fresh.email,
              displayName: fresh.displayName,
              role: fresh.role as AuthUser["role"],
              userType: fresh.userType,
              credits: fresh.credits,
              isPremium: fresh.isPremium,
              premiumUntil: fresh.premiumUntil,
            };
            AsyncStorage.setItem(USER_KEY, JSON.stringify(merged)).catch(() => {});
            setState((s) => ({ ...s, user: merged }));
          }).catch(() => {});
        }
      } else {
        setState((s) => ({ ...s, isLoading: false }));
      }
    })();
  }, []);

  useEffect(() => {
    setOn401Handler(async () => {
      if (refreshingRef.current) return;
      const refreshToken = await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
      if (refreshToken) {
        refreshingRef.current = true;
        try {
          const result = await api.auth.refresh(refreshToken);
          await AsyncStorage.setItem(TOKEN_KEY, result.token);
          await AsyncStorage.setItem(REFRESH_TOKEN_KEY, result.refreshToken);
          setState((s) => ({ ...s, token: result.token }));
          return;
        } catch {
          // refresh başarısız → logout
        } finally {
          refreshingRef.current = false;
        }
      }
      await clearStorage();
      setState({ user: null, token: null, isLoading: false });
    });
  }, []);

  const persist = async (user: AuthUser, token: string, refreshToken?: string) => {
    const ops: Promise<void>[] = [
      AsyncStorage.setItem(TOKEN_KEY, token),
      AsyncStorage.setItem(USER_KEY, JSON.stringify(user)),
    ];
    if (refreshToken) ops.push(AsyncStorage.setItem(REFRESH_TOKEN_KEY, refreshToken));
    await Promise.all(ops);
    setState({ user, token, isLoading: false });
  };

  const login = async (email: string, password: string) => {
    const { user, token, refreshToken } = await api.auth.login({ email, password });
    await persist(user, token, refreshToken);
  };

  const loginWithGoogle = async (idToken: string) => {
    const { user, token, refreshToken, isNewUser } = await api.auth.google(idToken);
    await persist(user, token, refreshToken);
    if (isNewUser) setNeedsOnboarding(true);
  };

  const completeOnboarding = () => setNeedsOnboarding(false);

  const register = async (
    email: string,
    password: string,
    displayName: string,
    userType?: "emigrant" | "consultant" | "diaspora"
  ) => {
    const { user, token, refreshToken } = await api.auth.register({ email, password, displayName, userType });
    await persist(user, token, refreshToken);
  };

  const logout = async () => {
    await clearStorage();
    setState({ user: null, token: null, isLoading: false });
  };

  const logoutOnUnauthorized = async () => {
    await clearStorage();
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
        credits: fresh.credits,
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
    <AuthContext.Provider value={{ ...state, needsOnboarding, login, loginWithGoogle, register, completeOnboarding, logout, logoutOnUnauthorized, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
