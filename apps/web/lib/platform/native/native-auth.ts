/**
 * Native Google sign-in bridge (Stage D — SCAFFOLD).
 *
 * Google blocks OAuth inside an embedded WebView (`disallowed_useragent`), so on the native shell the
 * sign-in must run in the SYSTEM browser and return to the app via a deep link. This module holds the
 * two ends of that flow. The web app's existing NextAuth Google flow is unchanged for browser/PWA use.
 *
 * ⚠️ The server hand-off is the remaining design task: after the system-browser sign-in completes, the
 * server must mint a ONE-TIME token and redirect to the app's deep-link scheme
 * (`com.arnavgarg.myos://auth?token=…`); the app then exchanges it for a WebView session (the browser
 * and the WebView do NOT share a cookie jar). That server endpoint does not exist yet — until it does,
 * `handleAuthReturn` only closes the browser. Registered here so the shell + manifest wiring are ready.
 */

/** The custom scheme the AndroidManifest intent-filter must register for the OAuth return. */
export const AUTH_RETURN_SCHEME = "com.arnavgarg.myos://auth";

/** Begin Google sign-in in the system browser (Custom Tab on Android). */
export async function startNativeGoogleSignIn(baseUrl: string): Promise<void> {
  try {
    const { Browser } = await import("@capacitor/browser");
    // `mobile=1` lets the server select the deep-link return once the one-time-token endpoint lands.
    await Browser.open({ url: `${baseUrl}/api/auth/signin/google?mobile=1` });
  } catch {
    // Fall back to a same-window navigation if the Browser plugin is unavailable.
    window.location.assign(`${baseUrl}/api/auth/signin/google`);
  }
}

/**
 * Handle the deep-link OAuth return. Currently a placeholder: closes the in-app browser. Wire the
 * one-time-token exchange here once the server endpoint exists (see module header).
 */
export async function handleAuthReturn(url: string): Promise<void> {
  if (!url.startsWith(AUTH_RETURN_SCHEME)) return;
  try {
    const { Browser } = await import("@capacitor/browser");
    await Browser.close();
  } catch {
    // ignore — nothing to close
  }
  // TODO(stage-d): const token = new URL(url).searchParams.get("token");
  //   → POST it to a server endpoint that sets the WebView session cookie, then reload the app.
}
