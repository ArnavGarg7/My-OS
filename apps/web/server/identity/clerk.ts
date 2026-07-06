import "server-only";
import { auth, currentUser } from "@clerk/nextjs/server";
import type { ProviderIdentity } from "./types";

/**
 * The ONLY module that talks to Clerk on the server. Everything else goes
 * through IdentityService. To swap auth backends, reimplement these two
 * functions (and the client `signOut`) — nothing else changes.
 */

/** The authenticated Clerk user id for this request, or null. */
export async function getProviderUserId(): Promise<string | null> {
  const { userId } = await auth();
  return userId;
}

/** Read-only provider identity facts (email, avatar, last sign-in). */
export async function getProviderIdentity(): Promise<ProviderIdentity | null> {
  const user = await currentUser();
  if (!user) return null;

  const primary = user.emailAddresses.find((e) => e.id === user.primaryEmailAddressId);
  return {
    email: primary?.emailAddress ?? user.emailAddresses[0]?.emailAddress ?? null,
    avatarUrl: user.imageUrl || null,
    emailVerified: primary?.verification?.status === "verified",
    lastLoginAt: user.lastSignInAt ? new Date(user.lastSignInAt).toISOString() : null,
  };
}
