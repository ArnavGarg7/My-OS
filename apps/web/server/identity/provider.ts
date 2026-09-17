import "server-only";
import { isClerkConfigured, isGoogleAuthConfigured } from "@myos/shared/env";
import { getEnv } from "../env";
import type { ProviderIdentity } from "./types";
import * as clerk from "./clerk";
import * as google from "./google";
import { readMobileSessionEmail } from "./mobile";

/**
 * Auth-backend dispatch. Selects the active provider seam by configuration — Clerk wins if configured,
 * else Google (Auth.js), else none (single-owner/dev handles the request in IdentityService). This is
 * the one place that knows which backend is live; `service.ts` stays backend-agnostic.
 */
function backend(): typeof clerk | typeof google | null {
  const env = getEnv();
  if (isClerkConfigured(env)) return clerk;
  if (isGoogleAuthConfigured(env)) return google;
  return null;
}

export async function getProviderUserId(): Promise<string | null> {
  // Native app (Stage D): a valid mobile-session cookie authenticates the WebView, independent of the
  // configured web backend. Checked first so the app works regardless of Clerk/Google selection.
  const mobileEmail = await readMobileSessionEmail().catch(() => null);
  if (mobileEmail) return mobileEmail;
  const b = backend();
  return b ? b.getProviderUserId() : null;
}

export async function getProviderIdentity(): Promise<ProviderIdentity | null> {
  const mobileEmail = await readMobileSessionEmail().catch(() => null);
  if (mobileEmail) {
    return { email: mobileEmail, avatarUrl: null, emailVerified: true, lastLoginAt: null };
  }
  const b = backend();
  return b ? b.getProviderIdentity() : null;
}
