import "server-only";
import { isClerkConfigured } from "@myos/shared/env";
import { getEnv } from "../env";

/**
 * Is Clerk wired up? When false, the app runs in local single-owner dev mode
 * (never in production). This is the single switch the identity layer consults
 * to decide between the Clerk backend and the dev fallback.
 */
export function clerkEnabled(): boolean {
  return isClerkConfigured(getEnv());
}

export function isProduction(): boolean {
  return getEnv().NODE_ENV === "production";
}

/** Where to send unauthenticated users. */
export function signInUrl(): string {
  return getEnv().NEXT_PUBLIC_CLERK_SIGN_IN_URL;
}
