import type { DisplayMode, OperatingSystem, PlatformCapabilities } from "./types";

/**
 * Feature detection (Sprint 1.7). Pure, SSR-safe reads of browser capabilities.
 * The providers use these; the rest of the app never feature-detects directly.
 */
export function detectCapabilities(): PlatformCapabilities {
  const hasWindow = typeof window !== "undefined";
  const nav = typeof navigator !== "undefined" ? navigator : undefined;

  return {
    serviceWorker: !!nav && "serviceWorker" in nav,
    push: hasWindow && "PushManager" in window,
    notifications: hasWindow && "Notification" in window,
    backgroundSync: hasWindow && "SyncManager" in window,
    periodicSync: hasWindow && "PeriodicSyncManager" in window,
    wakeLock: !!nav && "wakeLock" in nav,
    battery: !!nav && "getBattery" in nav,
    idleDetection: hasWindow && "IdleDetector" in window,
    connectionInfo: !!nav && "connection" in nav,
    share: !!nav && "share" in nav,
  };
}

const DISPLAY_MODES: DisplayMode[] = [
  "window-controls-overlay",
  "fullscreen",
  "minimal-ui",
  "standalone",
];

export function detectDisplayMode(): DisplayMode {
  if (typeof window === "undefined" || !window.matchMedia) return "browser";
  for (const mode of DISPLAY_MODES) {
    if (window.matchMedia(`(display-mode: ${mode})`).matches) return mode;
  }
  return "browser";
}

/** Is the app running as an installed/standalone app (incl. iOS Safari)? */
export function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  if (window.matchMedia?.("(display-mode: standalone)").matches) return true;
  if (window.matchMedia?.("(display-mode: window-controls-overlay)").matches) return true;
  const iosStandalone = (window.navigator as Navigator & { standalone?: boolean }).standalone;
  return iosStandalone === true;
}

export function detectOperatingSystem(
  userAgent: string | undefined = typeof navigator !== "undefined"
    ? navigator.userAgent
    : undefined,
): OperatingSystem {
  if (!userAgent) return "unknown";
  const ua = userAgent.toLowerCase();
  if (/iphone|ipad|ipod/.test(ua)) return "ios";
  if (/android/.test(ua)) return "android";
  if (/win/.test(ua)) return "windows";
  if (/mac/.test(ua)) return "macos";
  if (/linux/.test(ua)) return "linux";
  return "unknown";
}
