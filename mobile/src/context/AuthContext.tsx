import React, { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { api, AuthUser } from "../services/api";

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
        setState({ user: JSON.parse(userJson), token, isLoading: false });
      } else {
        setState((s) => ({ ...s, isLoading: false }));
      }
    })();
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

  return (
    <AuthContext.Provider value={{ ...state, login, loginWithGoogle, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
