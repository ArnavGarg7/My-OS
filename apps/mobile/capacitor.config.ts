import type { CapacitorConfig } from "@capacitor/cli";

/**
 * Capacitor config for the My OS Android shell (Stage D).
 *
 * HYBRID / remote-URL model: the native WebView loads the DEPLOYED web app (which already carries the
 * guarded Capacitor client code in apps/web), so there is no separate mobile UI to maintain — the app
 * IS the web app, plus native push, deep-link auth return, and platform chrome. `webDir` (www/) is only
 * a cold-start fallback shown if the server is unreachable before the first load.
 *
 * Point at a LAN dev server during development via MYOS_MOBILE_SERVER_URL (must be reachable from the
 * device/emulator, e.g. http://192.168.x.x:3000 with cleartext temporarily enabled); defaults to prod.
 */
const SERVER_URL = process.env.MYOS_MOBILE_SERVER_URL ?? "https://myosarnav.duckdns.org";
const serverHost = (() => {
  try {
    return new URL(SERVER_URL).host;
  } catch {
    return "myosarnav.duckdns.org";
  }
})();

const config: CapacitorConfig = {
  appId: "com.arnavgarg.myos",
  appName: "My OS",
  webDir: "www",
  server: {
    url: SERVER_URL,
    androidScheme: "https",
    // Keep navigation scoped to the app's own origin. Google sign-in deliberately does NOT run in the
    // WebView (Google blocks embedded OAuth) — it opens the system browser and returns via deep link,
    // so the Google auth domains are intentionally NOT allow-listed here.
    allowNavigation: [serverHost],
  },
  android: {
    // Deep links / OAuth return are handled by the App plugin listener in apps/web (native-auth).
    allowMixedContent: false,
  },
  plugins: {
    PushNotifications: {
      // A tapped notification opens the app; foreground presentation shows the system heads-up.
      presentationOptions: ["badge", "sound", "alert"],
    },
    SplashScreen: {
      launchShowDuration: 600,
      backgroundColor: "#0c0d0e",
      showSpinner: false,
    },
  },
};

export default config;
