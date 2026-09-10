import "server-only";
import { isClerkConfigured, isSingleOwnerMode } from "@myos/shared/env";
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

/**
 * Is the single-owner identity permitted in production? True only behind an explicit external gate
 * (`MYOS_SINGLE_OWNER=true`, e.g. Cloudflare Access) and only when Clerk is not configured. Lets the
 * O1 deployment run without Clerk while keeping the "no accidental unauthenticated prod" default.
 */
export function singleOwnerMode(): boolean {
  return isSingleOwnerMode(getEnv());
}

/** Where to send unauthenticated users. */
export function signInUrl(): string {
  return getEnv().NEXT_PUBLIC_CLERK_SIGN_IN_URL;
}
