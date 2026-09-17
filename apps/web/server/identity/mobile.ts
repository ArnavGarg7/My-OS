import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { and, eq, gt, isNull, lt } from "drizzle-orm";
import { cookies } from "next/headers";
import { mobileAuthTokens } from "@myos/db/schema";
import { ownerEmailAllowlist } from "@myos/shared/env";
import type { Database } from "@myos/db";
import { getEnv } from "../env";
import { MOBILE_SESSION_COOKIE, verifyMobileSession } from "@/lib/auth/mobile-session";

/**
 * Native-app auth seam (Stage D). Two responsibilities, both server-side (Node):
 *  1. Read the mobile-session cookie for the current request → the owner email (or null). Consumed by
 *     `provider.ts` so the WebView is a first-class authenticated session in the identity layer.
 *  2. Mint + consume the single-use one-time tokens that bridge a system-browser sign-in to a WebView
 *     session (see `lib/auth/mobile-session.ts` for the flow overview).
 */

/** One-time token lifetime — long enough to complete a deep-link round trip, short enough to be safe. */
const OTT_TTL_MS = 2 * 60 * 1000;

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** The authenticated owner email from a valid mobile-session cookie, gated by the owner allowlist. */
export async function readMobileSessionEmail(): Promise<string | null> {
  const store = await cookies();
  const raw = store.get(MOBILE_SESSION_COOKIE)?.value;
  const env = getEnv();
  const email = await verifyMobileSession(raw, env.AUTH_SECRET ?? "");
  if (!email) return null;
  const allow = ownerEmailAllowlist(env);
  // Fail-closed: if an allowlist is configured, the email must be on it.
  return allow.length === 0 || allow.includes(email) ? email : null;
}

/**
 * Mint a single-use token for `email` (an already-authenticated owner) and return the RAW token to put
 * in the deep link. Only its hash is stored. Best-effort GC of expired rows on the way in.
 */
export async function mintOneTimeToken(
  db: Database,
  email: string,
  now = new Date(),
): Promise<string> {
  await db
    .delete(mobileAuthTokens)
    .where(lt(mobileAuthTokens.expiresAt, now))
    .catch(() => {});
  const token = randomBytes(32).toString("base64url");
  await db.insert(mobileAuthTokens).values({
    tokenHash: hashToken(token),
    email: email.toLowerCase(),
    expiresAt: new Date(now.getTime() + OTT_TTL_MS),
  });
  return token;
}

/**
 * Consume a one-time token: valid (exists, unused, unexpired) → mark used and return the email. Atomic
 * on the `usedAt IS NULL` guard so a token can be redeemed at most once.
 */
export async function consumeOneTimeToken(
  db: Database,
  token: string,
  now = new Date(),
): Promise<string | null> {
  const hash = hashToken(token);
  const rows = await db
    .update(mobileAuthTokens)
    .set({ usedAt: now })
    .where(
      and(
        eq(mobileAuthTokens.tokenHash, hash),
        isNull(mobileAuthTokens.usedAt),
        gt(mobileAuthTokens.expiresAt, now),
      ),
    )
    .returning({ email: mobileAuthTokens.email });
  return rows[0]?.email ?? null;
}
