"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { isStandalone } from "../capabilities";
import type { BeforeInstallPromptEvent, InstallState } from "../types";

/**
 * Installability (Sprint 1.7). Captures the Chromium `beforeinstallprompt`
 * event so the app can offer a real install, and tracks whether we're already
 * running installed/standalone. Consumed via `useInstall()`.
 */
export interface InstallValue {
  state: InstallState;
  canInstall: boolean;
  isInstalled: boolean;
  /** Trigger the native install prompt. Resolves to the user's outcome. */
  promptInstall: () => Promise<"accepted" | "dismissed" | "unavailable">;
}

const InstallContext = createContext<InstallValue | null>(null);

export function InstallProvider({ children }: { children: ReactNode }) {
  const deferred = useRef<BeforeInstallPromptEvent | null>(null);
  const [canInstall, setCanInstall] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    setInstalled(isStandalone());

    const onBeforePrompt = (event: Event) => {
      event.preventDefault();
      deferred.current = event as BeforeInstallPromptEvent;
      setCanInstall(true);
    };
    const onInstalled = () => {
      deferred.current = null;
      setCanInstall(false);
      setInstalled(true);
    };

    window.addEventListener("beforeinstallprompt", onBeforePrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforePrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const value = useMemo<InstallValue>(() => {
    const state: InstallState = installed
      ? "installed"
      : canInstall
        ? "installable"
        : "unavailable";
    return {
      state,
      canInstall,
      isInstalled: installed,
      promptInstall: async () => {
        const event = deferred.current;
        if (!event) return "unavailable";
        await event.prompt();
        const choice = await event.userChoice;
        deferred.current = null;
        setCanInstall(false);
        return choice.outcome;
      },
    };
  }, [canInstall, installed]);

  return <InstallContext.Provider value={value}>{children}</InstallContext.Provider>;
}

export function useInstall(): InstallValue {
  const ctx = useContext(InstallContext);
  if (!ctx) throw new Error("useInstall must be used within <PlatformProvider>");
  return ctx;
}
