import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

/**
 * Full Auth.js instance (Node runtime): the edge-safe {@link authConfig} plus the token callbacks that
 * capture the Google grant. The Google access/refresh tokens are stashed on the (encrypted) JWT so the
 * Google connector can be seeded from the same sign-in consent — see the Google-auth stage charter.
 *
 * This is the single server seam for the Google backend, mirroring `server/identity/clerk.ts`. Feature
 * code never imports it directly; it goes through `server/identity/provider.ts` → IdentityService.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  callbacks: {
    ...authConfig.callbacks,
    jwt({ token, account }) {
      // `account` is present only on the initial sign-in; persist the grant for connector seeding.
      // Standard claims (email/name/picture) are populated by Auth.js from the Google profile itself.
      if (account) {
        token.googleAccessToken = account.access_token;
        token.googleRefreshToken = account.refresh_token;
        token.googleExpiresAt = account.expires_at;
        token.googleScope = account.scope;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user && token.sub) session.user.id = token.sub;
      return session;
    },
  },
});
