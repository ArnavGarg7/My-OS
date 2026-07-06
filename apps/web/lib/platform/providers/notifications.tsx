"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { NotificationPermissionState } from "../types";

/**
 * Notification infrastructure (Sprint 1.7). Abstracts permission + local display
 * and exposes visibility/focus so features can decide whether to notify. No
 * reminder engine, no scheduling. Consumed via `useNotifications()`.
 */
export interface NotificationsValue {
  supported: boolean;
  permission: NotificationPermissionState;
  isGranted: boolean;
  isVisible: boolean;
  isFocused: boolean;
  request: () => Promise<NotificationPermissionState>;
  /** Show a local notification (prefers the SW registration when available). */
  notify: (title: string, options?: NotificationOptions) => Promise<boolean>;
}

const NotificationsContext = createContext<NotificationsValue | null>(null);

function readPermission(): NotificationPermissionState {
  if (typeof window === "undefined" || !("Notification" in window)) return "unsupported";
  return Notification.permission;
}

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const [permission, setPermission] = useState<NotificationPermissionState>("default");
  const [isVisible, setIsVisible] = useState(true);
  const [isFocused, setIsFocused] = useState(true);

  useEffect(() => {
    setPermission(readPermission());
    setIsVisible(document.visibilityState === "visible");
    setIsFocused(document.hasFocus());

    const onVisibility = () => setIsVisible(document.visibilityState === "visible");
    const onFocus = () => setIsFocused(true);
    const onBlur = () => setIsFocused(false);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("focus", onFocus);
    window.addEventListener("blur", onBlur);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("blur", onBlur);
    };
  }, []);

  const value = useMemo<NotificationsValue>(() => {
    const supported = permission !== "unsupported";
    return {
      supported,
      permission,
      isGranted: permission === "granted",
      isVisible,
      isFocused,
      request: async () => {
        if (!supported) return "unsupported";
        const result = await Notification.requestPermission();
        setPermission(result);
        return result;
      },
      notify: async (title, options) => {
        if (permission !== "granted") return false;
        try {
          if ("serviceWorker" in navigator) {
            const registration = await navigator.serviceWorker.ready;
            await registration.showNotification(title, options);
          } else {
            new Notification(title, options);
          }
          return true;
        } catch {
          return false;
        }
      },
    };
  }, [permission, isVisible, isFocused]);

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
}

export function useNotifications(): NotificationsValue {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error("useNotifications must be used within <PlatformProvider>");
  return ctx;
}
