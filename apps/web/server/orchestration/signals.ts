import "server-only";
import { computeSignals, type OrchestrationSignals } from "@myos/core/orchestration";
import type { Database } from "@myos/db";
import * as repo from "./repository";

/**
 * Orchestration signals (Sprint 3.5) for the Decision engine. Deterministic booleans +
 * counts derived from persisted run history. There is no background queue yet, so
 * pendingPipelines is 0. The Decision engine turns these into recommendations;
 * orchestration never emits decisions itself.
 */
export async function orchestrationSignals(
  db: Database,
  tz: string,
): Promise<OrchestrationSignals> {
  const history = await repo.listRuns(db, undefined, 200);
  return computeSignals({ history, now: new Date(), timezone: tz, pendingPipelines: 0 });
}
