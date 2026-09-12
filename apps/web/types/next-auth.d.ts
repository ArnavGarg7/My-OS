import type { DefaultSession } from "next-auth";

/**
 * Module augmentation for the Google-auth backend: a stable user id on the session, and the Google
 * grant fields we persist on the JWT for connector seeding (see auth.ts).
 */
declare module "next-auth" {
  interface Session {
    user: { id?: string } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    googleAccessToken?: string;
    googleRefreshToken?: string;
    googleExpiresAt?: number;
    googleScope?: string;
  }
}
