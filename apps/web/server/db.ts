import "server-only";
import { createDb, type DbHandle } from "@myos/db";
import { getEnv } from "./env";

// Reuse a single pool across hot reloads in dev (avoids exhausting connections).
const globalForDb = globalThis as unknown as { __myosDb?: DbHandle };

/** Lazily created, process-wide database handle (04 §10). */
export function getDb(): DbHandle {
  return (globalForDb.__myosDb ??= createDb(getEnv().DATABASE_URL, { max: 10 }));
}
