import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { AppState, AppStateStatus } from "react-native";
import { api } from "../services/api";

interface NotificationContextValue {
  unreadCount: number;
  refreshCount: () => void;
}

const NotificationContext = createContext<NotificationContextValue>({
  unreadCount: 0,
  refreshCount: () => {},
});

export function NotificationProvider({
  token,
  children,
}: {
  token: string | null;
  children: React.ReactNode;
}) {
  const [unreadCount, setUnreadCount] = useState(0);
  const tokenRef = useRef(token);
  tokenRef.current = token;

  const refreshCount = useCallback(async () => {
    if (!tokenRef.current) return;
    try {
      const { count } = await api.notifications.getUnreadCount(tokenRef.current);
      setUnreadCount(count);
    } catch {}
  }, []);

  useEffect(() => {
    refreshCount();
    const sub = AppState.addEventListener("change", (state: AppStateStatus) => {
      if (state === "active") refreshCount();
    });
    const interval = setInterval(refreshCount, 5_000);
    return () => {
      sub.remove();
      clearInterval(interval);
    };
  }, [refreshCount]);

  // Reset count when token changes (logout)
  useEffect(() => {
    if (!token) setUnreadCount(0);
  }, [token]);

  return (
    <NotificationContext.Provider value={{ unreadCount, refreshCount }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotificationCount(): NotificationContextValue {
  return useContext(NotificationContext);
}
