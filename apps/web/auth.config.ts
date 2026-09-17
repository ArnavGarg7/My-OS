import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import { MOBILE_SESSION_COOKIE, verifyMobileSession } from "@/lib/auth/mobile-session";

/**
 * Edge-safe Auth.js config (the part the middleware can import). No DB, no Node-only imports, and it
 * reads `process.env` directly rather than the zod env layer so it stays light in the edge runtime.
 * The full instance (token callbacks, connector seeding) lives in `auth.ts`, which spreads this.
 *
 * Google is both the sign-in provider AND the source of the Google connector's grant, so sign-in
 * requests the connector read scopes up front (one consent) — see the Google-auth stage charter.
 */
// Sign-in requests IDENTITY ONLY. The Calendar/Gmail/Drive scopes are restricted/sensitive and Google
// blocks them at login for an unverified app ("Access blocked … keeping apps secure"). The Google
// connector requests those scopes separately, on demand, through the connector OAuth flow.
const GOOGLE_SCOPES = ["openid", "email", "profile"].join(" ");

/** Google emails allowed to sign in (lower-cased). Empty = nobody (fail-closed). */
function ownerAllowlist(): string[] {
  return (process.env.MYOS_OWNER_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

/** Public routes reachable without a session (mirrors the Clerk middleware's matcher). */
function isPublicPath(pathname: string): boolean {
  return (
    pathname === "/" ||
    pathname.startsWith("/sign-in") ||
    pathname.startsWith("/sign-up") ||
    pathname.startsWith("/showcase") ||
    pathname.startsWith("/api/health") ||
    pathname.startsWith("/api/auth") ||
    // Native-app auth bridge (Stage D): start/handoff/exchange run before a WebView session exists.
    pathname.startsWith("/api/mobile/auth")
  );
}

export const authConfig = {
  trustHost: true, // honour X-Forwarded-Proto/Host behind Caddy so callback URLs are https
  // `secret` is read from AUTH_SECRET automatically by Auth.js — no need to pass it here.
  pages: { signIn: "/sign-in" },
  providers: [
    Google({
      clientId: process.env.MYOS_GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.MYOS_GOOGLE_CLIENT_SECRET ?? "",
      authorization: {
        params: { scope: GOOGLE_SCOPES, prompt: "select_account" },
      },
    }),
  ],
  callbacks: {
    /** Allowlist gate — only the owner's Google account(s) may sign in. */
    signIn({ profile }) {
      const email = profile?.email?.toLowerCase();
      const list = ownerAllowlist();
      return Boolean(email && list.includes(email));
    },
    /** Route protection when `auth` is used as middleware. */
    async authorized({ auth, request }) {
      if (isPublicPath(request.nextUrl.pathname)) return true;
      if (auth?.user) return true;
      // Native app (Stage D): honour a valid mobile-session cookie for an allowed owner. Verified with
      // Web Crypto so it works in the edge middleware runtime (no node:crypto).
      const email = await verifyMobileSession(
        request.cookies.get(MOBILE_SESSION_COOKIE)?.value,
        process.env.AUTH_SECRET ?? "",
      );
      return Boolean(email && ownerAllowlist().includes(email));
    },
  },
} satisfies NextAuthConfig;
