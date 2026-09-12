import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";

/**
 * Edge-safe Auth.js config (the part the middleware can import). No DB, no Node-only imports, and it
 * reads `process.env` directly rather than the zod env layer so it stays light in the edge runtime.
 * The full instance (token callbacks, connector seeding) lives in `auth.ts`, which spreads this.
 *
 * Google is both the sign-in provider AND the source of the Google connector's grant, so sign-in
 * requests the connector read scopes up front (one consent) — see the Google-auth stage charter.
 */
const GOOGLE_SCOPES = [
  "openid",
  "email",
  "profile",
  "https://www.googleapis.com/auth/calendar.readonly",
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/drive.metadata.readonly",
].join(" ");

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
    pathname.startsWith("/api/auth")
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
        params: { scope: GOOGLE_SCOPES, access_type: "offline", prompt: "consent" },
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
    authorized({ auth, request }) {
      if (isPublicPath(request.nextUrl.pathname)) return true;
      return Boolean(auth?.user);
    },
  },
} satisfies NextAuthConfig;
