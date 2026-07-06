"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { APP_VERSION } from "@myos/shared/constants";
import { detectCapabilities, detectDisplayMode, detectOperatingSystem } from "../capabilities";
import type { DisplayMode, OperatingSystem, PlatformCapabilities } from "../types";

/**
 * Platform facts (Sprint 1.7): capabilities, display mode, OS, app version.
 * Consumed via `usePlatform()` / `useCapabilities()`.
 */
export interface PlatformValue {
  capabilities: PlatformCapabilities;
  displayMode: DisplayMode;
  os: OperatingSystem;
  standalone: boolean;
  appVersion: string;
}

const EMPTY_CAPABILITIES: PlatformCapabilities = {
  serviceWorker: false,
  push: false,
  notifications: false,
  backgroundSync: false,
  periodicSync: false,
  wakeLock: false,
  battery: false,
  idleDetection: false,
  connectionInfo: false,
  share: false,
};

const PlatformContext = createContext<PlatformValue | null>(null);

export function PlatformInfoProvider({ children }: { children: ReactNode }) {
  // SSR-safe defaults; real values resolve after mount to avoid hydration drift.
  const [capabilities, setCapabilities] = useState<PlatformCapabilities>(EMPTY_CAPABILITIES);
  const [displayMode, setDisplayMode] = useState<DisplayMode>("browser");
  const [os, setOs] = useState<OperatingSystem>("unknown");

  useEffect(() => {
    setCapabilities(detectCapabilities());
    setOs(detectOperatingSystem());

    const applyDisplayMode = () => setDisplayMode(detectDisplayMode());
    applyDisplayMode();

    const media = window.matchMedia("(display-mode: standalone)");
    media.addEventListener?.("change", applyDisplayMode);
    return () => media.removeEventListener?.("change", applyDisplayMode);
  }, []);

  const value = useMemo<PlatformValue>(
    () => ({
      capabilities,
      displayMode,
      os,
      standalone: displayMode !== "browser",
      appVersion: APP_VERSION,
    }),
    [capabilities, displayMode, os],
  );

  return <PlatformContext.Provider value={value}>{children}</PlatformContext.Provider>;
}

export function usePlatform(): PlatformValue {
  const ctx = useContext(PlatformContext);
  if (!ctx) throw new Error("usePlatform must be used within <PlatformProvider>");
  return ctx;
}

export function useCapabilities(): PlatformCapabilities {
  return usePlatform().capabilities;
}
