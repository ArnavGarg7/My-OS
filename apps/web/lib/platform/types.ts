/**
 * Platform integration types (Sprint 1.7). Provider-agnostic contracts for the
 * browser/OS capabilities the app consumes via hooks — features never touch the
 * underlying browser APIs directly.
 */

export type ConnectionStatus = "online" | "offline";

/** `unsupported` folds the missing-API case into the permission model. */
export type NotificationPermissionState = "default" | "granted" | "denied" | "unsupported";

export type ServiceWorkerStatus =
  "unsupported" | "unregistered" | "registering" | "registered" | "waiting" | "error";

export type InstallState = "unsupported" | "installable" | "installed" | "unavailable";

export type DisplayMode =
  "browser" | "minimal-ui" | "standalone" | "fullscreen" | "window-controls-overlay";

export type OperatingSystem = "windows" | "macos" | "ios" | "android" | "linux" | "unknown";

export type PushPermissionState = NotificationPermissionState;

/** Optional browser capabilities. Everything degrades gracefully when absent. */
export interface PlatformCapabilities {
  serviceWorker: boolean;
  push: boolean;
  notifications: boolean;
  backgroundSync: boolean;
  periodicSync: boolean;
  wakeLock: boolean;
  battery: boolean;
  idleDetection: boolean;
  connectionInfo: boolean;
  share: boolean;
}

/** The (non-standard, Chromium) install prompt event. */
export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  prompt: () => Promise<void>;
  readonly userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}
