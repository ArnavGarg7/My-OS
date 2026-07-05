import { getDb } from "./db";

/**
 * Per-request tRPC context (04 §5). Auth/session are attached from Stage 0/1;
 * Sprint 1.1 exposes the database handle only.
 */
export function createContext() {
  const { db, sql } = getDb();
  return { db, sql };
}

export type Context = ReturnType<typeof createContext>;
