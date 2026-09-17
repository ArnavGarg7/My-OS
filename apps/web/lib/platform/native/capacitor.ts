import { Capacitor } from "@capacitor/core";

/**
 * Native (Capacitor) detection for the hybrid Android shell (Stage D).
 *
 * The deployed web app runs in three contexts — a normal browser, an installed PWA, and the native
 * Capacitor WebView. These helpers let the client code light up native-only behaviour (push, status
 * bar, deep-link auth) while staying a complete no-op everywhere else. Everything that follows a true
 * result here is loaded lazily so browser/PWA users never pull the native plugin chunks.
 */
export function isNativeApp(): boolean {
  try {
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
}

/** "android" | "ios" | "web" — "web" for a normal browser or PWA. */
export function nativePlatform(): string {
  try {
    return Capacitor.getPlatform();
  } catch {
    return "web";
  }
}
