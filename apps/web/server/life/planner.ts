import "server-only";
import { materializeRoutines, type RoutineBlockDraft } from "@myos/core/life";
import type { Database } from "@myos/db";
import * as repo from "./repository";

/**
 * Life → Planner materialization (Sprint 4.2). Reads active routines and produces block
 * DRAFTS the Planner can persist. This never mutates routine definitions — the Planner
 * owns the materialized blocks; routines remain the single source of truth.
 */
export async function routineBlocks(db: Database): Promise<RoutineBlockDraft[]> {
  const routines = await repo.listRoutines(db);
  return materializeRoutines(routines);
}
