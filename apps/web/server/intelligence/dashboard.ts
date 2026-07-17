import "server-only";
import { buildDashboard, type Dashboard } from "@myos/core/intelligence";
import type { Database } from "@myos/db";
import { composeInput } from "./composer";

/**
 * Server dashboard view (Sprint 4.4). Loads the composed input and defers to the pure
 * `buildDashboard`. Nothing is cached: the whole executive view is one deterministic
 * function of read models the owning modules just produced.
 */
export async function dashboard(db: Database, tz: string): Promise<Dashboard> {
  return buildDashboard(await composeInput(db, tz));
}
