import "server-only";
import type { HealthSignals } from "@myos/core/health";
import type { Database } from "@myos/db";
import { buildSignals } from "./summary";

/**
 * Health signals for cross-module consumers (Sprint 2.9). Decision / Planner /
 * Morning read this deterministic shape — never the raw health tables. Returns
 * null when there is nothing logged for the day (callers treat as "unknown").
 */
export async function healthSignals(
  db: Database,
  date: string,
  now = new Date(),
): Promise<HealthSignals> {
  return buildSignals(db, date, now);
}
