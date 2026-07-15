import "server-only";
import { desc, eq, inArray } from "drizzle-orm";
import type { Database } from "@myos/db";
import {
  orchestrationFailures,
  orchestrationRecovery,
  orchestrationRuns,
  orchestrationSteps,
  type OrchestrationRunRow,
} from "@myos/db/schema";
import type {
  OrchestrationFailure,
  OrchestrationRun,
  RecoveryDecision,
} from "@myos/core/orchestration";
import { failureRowToFailure, runRowToRun, runToColumns } from "./mapper";

/**
 * Orchestration persistence (Sprint 3.5). Stores runs + their steps + failures +
 * recovery decisions. Read-mostly — a run is written once when it completes.
 */
async function hydrate(db: Database, rows: OrchestrationRunRow[]): Promise<OrchestrationRun[]> {
  if (rows.length === 0) return [];
  const ids = rows.map((r) => r.id);
  const steps = await db
    .select()
    .from(orchestrationSteps)
    .where(inArray(orchestrationSteps.runId, ids));
  const byRun = new Map<string, typeof steps>();
  for (const s of steps) {
    const list = byRun.get(s.runId) ?? [];
    list.push(s);
    byRun.set(s.runId, list);
  }
  return rows.map((r) => runRowToRun(r, byRun.get(r.id) ?? []));
}

export async function listRuns(
  db: Database,
  pipeline: string | undefined,
  limit: number,
): Promise<OrchestrationRun[]> {
  const rows = pipeline
    ? await db
        .select()
        .from(orchestrationRuns)
        .where(eq(orchestrationRuns.pipeline, pipeline))
        .orderBy(desc(orchestrationRuns.startedAt))
        .limit(limit)
    : await db
        .select()
        .from(orchestrationRuns)
        .orderBy(desc(orchestrationRuns.startedAt))
        .limit(limit);
  return hydrate(db, rows);
}

export async function getRun(db: Database, id: string): Promise<OrchestrationRun | null> {
  const [row] = await db
    .select()
    .from(orchestrationRuns)
    .where(eq(orchestrationRuns.id, id))
    .limit(1);
  if (!row) return null;
  const [run] = await hydrate(db, [row]);
  return run ?? null;
}

/** Persist a completed run + its steps + failures + recovery decisions. */
export async function saveRun(
  db: Database,
  run: OrchestrationRun,
  failures: OrchestrationFailure[],
  recoveries: RecoveryDecision[],
): Promise<OrchestrationRun> {
  const [row] = await db
    .insert(orchestrationRuns)
    .values({ id: run.id, ...runToColumns(run) })
    .returning();
  if (!row) throw new Error("Failed to save orchestration run");

  if (run.steps.length > 0) {
    await db.insert(orchestrationSteps).values(
      run.steps.map((s, i) => ({
        runId: run.id,
        module: s.module,
        stepOrder: i,
        outcome: s.outcome,
        mode: s.mode,
        runtimeMs: s.runtimeMs,
        detail: s.detail ?? null,
      })),
    );
  }
  if (failures.length > 0) {
    await db.insert(orchestrationFailures).values(
      failures.map((f) => ({
        runId: run.id,
        module: f.module,
        error: f.error,
        strategy: f.strategy,
        recovered: f.recovered,
      })),
    );
  }
  if (recoveries.length > 0) {
    await db.insert(orchestrationRecovery).values(
      recoveries.map((r) => ({
        runId: run.id,
        module: r.module,
        strategy: r.strategy,
        skipped: r.skip,
        reason: r.reason,
      })),
    );
  }
  return (await getRun(db, run.id))!;
}

export async function listFailures(db: Database, limit: number): Promise<OrchestrationFailure[]> {
  const rows = await db
    .select()
    .from(orchestrationFailures)
    .orderBy(desc(orchestrationFailures.at))
    .limit(limit);
  return rows.map(failureRowToFailure);
}

export async function listRecovery(db: Database, limit: number) {
  return db
    .select()
    .from(orchestrationRecovery)
    .orderBy(desc(orchestrationRecovery.at))
    .limit(limit);
}
