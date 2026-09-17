/**
 * Native Google sign-in bridge (Stage D).
 *
 * Google blocks OAuth inside an embedded WebView (`disallowed_useragent`), so on the native shell the
 * sign-in runs in the SYSTEM browser and returns via a deep link. Flow:
 *   1. `startNativeGoogleSignIn` opens the system browser at `/api/mobile/auth/start`.
 *   2. The user signs in with Google there; the server (handoff route) mints a single-use token and
 *      deep-links back to `com.arnavgarg.myos://auth?token=…`.
 *   3. `handleAuthReturn` (fired by the App plugin's `appUrlOpen`) POSTs that token to
 *      `/api/mobile/auth/exchange` FROM THE WEBVIEW, which sets the httpOnly mobile-session cookie in the
 *      WebView's own jar; the app then reloads, now authenticated.
 * The web app's normal NextAuth Google flow is unchanged for browser/PWA use.
 */

/** The custom scheme the AndroidManifest intent-filter must register for the OAuth return. */
export const AUTH_RETURN_SCHEME = "com.arnavgarg.myos://auth";

/** The app origin the WebView is served from — where the auth endpoints live. */
function appOrigin(): string {
  try {
    return window.location.origin;
  } catch {
    return "";
  }
}

/** Begin Google sign-in in the system browser (Custom Tab on Android). */
export async function startNativeGoogleSignIn(baseUrl = appOrigin()): Promise<void> {
  const url = `${baseUrl}/api/mobile/auth/start`;
  try {
    const { Browser } = await import("@capacitor/browser");
    await Browser.open({ url });
  } catch {
    // Fall back to a same-window navigation if the Browser plugin is unavailable.
    window.location.assign(url);
  }
}

/**
 * Handle the deep-link auth return: exchange the one-time token for a WebView session cookie, then
 * reload so the app picks up the authenticated state. No-op for unrelated deep links.
 */
export async function handleAuthReturn(url: string): Promise<void> {
  if (!url.startsWith(AUTH_RETURN_SCHEME)) return;
  try {
    const { Browser } = await import("@capacitor/browser");
    await Browser.close();
  } catch {
    // ignore — nothing to close
  }

  let token: string | null = null;
  try {
    token = new URL(url).searchParams.get("token");
  } catch {
    token = null;
  }
  if (!token) return;

  try {
    const res = await fetch(`${appOrigin()}/api/mobile/auth/exchange`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ token }),
    });
    if (res.ok) window.location.assign("/home");
  } catch {
    // Leave the user on the current screen; they can retry sign-in.
  }
}
