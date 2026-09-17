import { type NextRequest } from "next/server";
import { auth } from "@/auth";
import { getDb } from "@/server/db";
import { mintOneTimeToken } from "@/server/identity/mobile";

/**
 * Native-app sign-in handoff (Stage D). Reached in the SYSTEM browser after a successful Google sign-in
 * (its NextAuth session cookie lives here, in the browser). Mints a single-use token bound to the
 * authenticated owner email and returns a tiny page that deep-links back into the app
 * (`com.arnavgarg.myos://auth?token=…`). The app then exchanges the token for a WebView session.
 *
 * A page (not a bare 302) is used because a redirect straight to a custom scheme is flaky across
 * browsers — the inline script triggers the app intent reliably, with a manual link as a fallback.
 */
export const dynamic = "force-dynamic";

// Keep in sync with AUTH_RETURN_SCHEME in lib/platform/native/native-auth.ts and the AndroidManifest.
const APP_SCHEME = "com.arnavgarg.myos://auth";

function page(body: string): Response {
  return new Response(
    `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>My OS</title><body style="margin:0;height:100vh;display:flex;align-items:center;justify-content:center;background:#0c0d0e;color:#e7e9ea;font-family:system-ui,sans-serif;text-align:center;padding:24px">${body}</body>`,
    { headers: { "content-type": "text/html; charset=utf-8" } },
  );
}

export async function GET(_req: NextRequest): Promise<Response> {
  const session = await auth().catch(() => null);
  const email = session?.user?.email;
  if (!email) {
    return page(`<div><p>Sign-in didn't complete. Reopen the app and try again.</p></div>`);
  }

  let token: string;
  try {
    token = await mintOneTimeToken(getDb().db, email);
  } catch {
    return page(`<div><p>Couldn't start your session. Please try again.</p></div>`);
  }

  const deepLink = `${APP_SCHEME}?token=${encodeURIComponent(token)}`;
  return page(
    `<div><p>Signed in — returning to My OS…</p><p><a href="${deepLink}" style="color:#ffb68e">Tap here if the app doesn't open</a></p></div>` +
      `<script>location.replace(${JSON.stringify(deepLink)});</script>`,
  );
}
