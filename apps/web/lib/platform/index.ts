/**
 * Platform layer (Sprint 1.7). One import surface for OS/browser integration.
 * Feature modules consume these hooks and never call browser platform APIs
 * (service worker, push, notifications, install, connection) directly.
 */
export { PlatformProvider } from "./platform-provider";
export { useConnection, type ConnectionValue } from "./providers/connection";
export { useInstall, type InstallValue } from "./providers/install";
export { usePlatform, useCapabilities, type PlatformValue } from "./providers/platform";
export { useUpdates, type UpdatesValue } from "./providers/updates";
export { useNotifications, type NotificationsValue } from "./providers/notifications";
export { usePush, type PushValue } from "./providers/push";
export {
  useBackgroundSync,
  useWakeLock,
  useBattery,
  type BackgroundSync,
  type WakeLock,
  type BatteryStatus,
} from "./device";
export { compareVersions, isNewerVersion, parseVersion } from "./version";
export {
  detectCapabilities,
  detectDisplayMode,
  detectOperatingSystem,
  isStandalone,
} from "./capabilities";
export type {
  ConnectionStatus,
  NotificationPermissionState,
  ServiceWorkerStatus,
  InstallState,
  DisplayMode,
  OperatingSystem,
  PlatformCapabilities,
} from "./types";
