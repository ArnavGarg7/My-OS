/**
 * Mobile session token (Stage D — native app auth).
 *
 * The native Capacitor app can't hold a Google/NextAuth session the way a browser does (Google blocks
 * in-WebView OAuth, and a system-browser sign-in lands its cookie in a different cookie jar than the
 * WebView). So after a system-browser sign-in, the server issues THIS purpose-built session: a compact
 * HMAC-signed `email + expiry` token, set as an httpOnly cookie in the WebView. The identity layer and
 * the auth middleware both accept it as a valid owner session, alongside the normal NextAuth session.
 *
 * Deliberately edge- AND node-safe (Web Crypto only, no `node:crypto`, no `next/headers`, no
 * `server-only`): it is verified in the edge middleware (`auth.config.ts`) and minted/read in Node
 * route handlers + the identity seam. Signing key is `AUTH_SECRET` — the same trust root as NextAuth.
 */

export const MOBILE_SESSION_COOKIE = "myos_mobile_session";
/** How long a native session lasts before the app must sign in again. */
export const MOBILE_SESSION_TTL_MS = 60 * 24 * 60 * 60 * 1000; // 60 days

function b64urlEncode(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64urlDecode(text: string): Uint8Array {
  const pad = "=".repeat((4 - (text.length % 4)) % 4);
  const bin = atob(text.replace(/-/g, "+").replace(/_/g, "/") + pad);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

/**
 * Copy bytes into a fresh, plain ArrayBuffer. Web Crypto's `BufferSource` params reject the generic
 * `Uint8Array<ArrayBufferLike>` that `TextEncoder`/`atob` produce under recent TS libs, so hand them a
 * concrete ArrayBuffer.
 */
function bufferOf(input: string | Uint8Array): ArrayBuffer {
  const view = typeof input === "string" ? new TextEncoder().encode(input) : input;
  const out = new ArrayBuffer(view.byteLength);
  new Uint8Array(out).set(view);
  return out;
}

async function hmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    bufferOf(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

interface Payload {
  e: string; // email (lower-cased)
  iat: number;
  exp: number;
}

/** Mint a signed `<payload>.<sig>` mobile-session value for an authenticated owner email. */
export async function signMobileSession(
  email: string,
  secret: string,
  now = Date.now(),
): Promise<string> {
  const payload: Payload = { e: email.toLowerCase(), iat: now, exp: now + MOBILE_SESSION_TTL_MS };
  const body = b64urlEncode(new TextEncoder().encode(JSON.stringify(payload)));
  const sig = await crypto.subtle.sign("HMAC", await hmacKey(secret), bufferOf(body));
  return `${body}.${b64urlEncode(new Uint8Array(sig))}`;
}

/** Verify a mobile-session value; returns the email when the signature + expiry are valid, else null. */
export async function verifyMobileSession(
  value: string | undefined,
  secret: string,
  now = Date.now(),
): Promise<string | null> {
  if (!value || !secret) return null;
  const dot = value.indexOf(".");
  if (dot <= 0) return null;
  const body = value.slice(0, dot);
  const sig = value.slice(dot + 1);
  try {
    const ok = await crypto.subtle.verify(
      "HMAC",
      await hmacKey(secret),
      bufferOf(b64urlDecode(sig)),
      bufferOf(body),
    );
    if (!ok) return null;
    const payload = JSON.parse(new TextDecoder().decode(bufferOf(b64urlDecode(body)))) as Payload;
    if (typeof payload.exp !== "number" || payload.exp < now) return null;
    return typeof payload.e === "string" ? payload.e : null;
  } catch {
    return null;
  }
}
