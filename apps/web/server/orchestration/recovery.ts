import "server-only";
import type { Database } from "@myos/db";
import * as repo from "./repository";

/**
 * Orchestration recovery (Sprint 3.5). The pure recovery strategies live in the core
 * executor; this server module exposes the persisted recovery decisions for the UI.
 */
export function recentRecovery(db: Database, limit = 50) {
  return repo.listRecovery(db, limit);
}
