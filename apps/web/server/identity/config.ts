import "server-only";
import { isClerkConfigured, isGoogleAuthConfigured, isSingleOwnerMode } from "@myos/shared/env";
import { getEnv } from "../env";

/**
 * Is Clerk wired up? When false, the app runs in local single-owner dev mode
 * (never in production). This is the single switch the identity layer consults
 * to decide between the Clerk backend and the dev fallback.
 */
export function clerkEnabled(): boolean {
  return isClerkConfigured(getEnv());
}

/** Is Google (Auth.js) sign-in the active backend? (Production self-hosted default; Clerk still wins.) */
export function googleAuthEnabled(): boolean {
  return isGoogleAuthConfigured(getEnv());
}

/** Is any real auth backend (Clerk or Google) configured? When false, the single-owner/dev path runs. */
export function externalAuthEnabled(): boolean {
  return clerkEnabled() || googleAuthEnabled();
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
