import "server-only";
import { auth } from "@/auth";
import type { ProviderIdentity } from "./types";

/**
 * Google (Auth.js) implementation of the identity provider seam — the analogue of `clerk.ts`. Reads the
 * current request's Auth.js session. Everything else goes through IdentityService via `provider.ts`.
 */

/** The authenticated provider id for this request (Google `sub`, falling back to email), or null. */
export async function getProviderUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? session?.user?.email ?? null;
}

/** Read-only provider identity facts from the Google session. */
export async function getProviderIdentity(): Promise<ProviderIdentity | null> {
  const session = await auth();
  const user = session?.user;
  if (!user) return null;
  return {
    email: user.email ?? null,
    avatarUrl: user.image ?? null,
    emailVerified: true, // Google-authenticated emails are verified by Google
    lastLoginAt: null,
  };
}
