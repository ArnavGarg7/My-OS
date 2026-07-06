import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import { getDb } from "./db";
import { getCurrentUser } from "./identity";
import type { Identity } from "./identity";

/**
 * Per-request tRPC context (04 §5). Exposes the database handle plus a memoized
 * identity resolver. Identity is resolved lazily (via the IdentityService, which
 * wraps Clerk) so public procedures pay nothing and protected ones share one
 * lookup per request.
 */
export function createContext(_opts?: FetchCreateContextFnOptions) {
  const { db, sql } = getDb();
  let identity: Promise<Identity | null> | undefined;
  return {
    db,
    sql,
    getIdentity: () => (identity ??= getCurrentUser()),
  };
}

export type Context = ReturnType<typeof createContext>;
