import "server-only";
import {
  buildSummary,
  failedRuns,
  isFullRun,
  recoveredRuns,
  runsToday,
  type OrchestrationSummary,
} from "@myos/core/orchestration";
import type { Database } from "@myos/db";
import * as repo from "./repository";

/**
 * Orchestration summary + statistics (Sprint 3.5). Pure read helpers over persisted run
 * history — the compact summary (status bar / Morning / Tomorrow) and richer statistics
 * for the Statistics view. All derived; orchestration stores nothing extra.
 */
export async function summary(db: Database, tz: string): Promise<OrchestrationSummary> {
  const history = await repo.listRuns(db, undefined, 200);
  return buildSummary(history, new Date(), tz);
}

export interface OrchestrationStatistics {
  totalRuns: number;
  runsToday: number;
  fullRuns: number;
  failedRuns: number;
  recoveredRuns: number;
  avgRuntimeMs: number;
  byPipeline: { pipeline: string; runs: number; failures: number }[];
}

export async function statistics(db: Database, tz: string): Promise<OrchestrationStatistics> {
  const history = await repo.listRuns(db, undefined, 200);
  const today = runsToday(history, new Date(), tz);
  const runtimes = history.map((r) => r.runtimeMs ?? 0).filter((n) => n > 0);
  const avg =
    runtimes.length > 0 ? Math.round(runtimes.reduce((a, b) => a + b, 0) / runtimes.length) : 0;

  const byPipeline = new Map<string, { runs: number; failures: number }>();
  for (const run of history) {
    const entry = byPipeline.get(run.pipeline) ?? { runs: 0, failures: 0 };
    entry.runs += 1;
    if (run.status === "failed") entry.failures += 1;
    byPipeline.set(run.pipeline, entry);
  }

  return {
    totalRuns: history.length,
    runsToday: today.length,
    fullRuns: history.filter(isFullRun).length,
    failedRuns: failedRuns(history).length,
    recoveredRuns: recoveredRuns(history).length,
    avgRuntimeMs: avg,
    byPipeline: [...byPipeline.entries()]
      .map(([pipeline, v]) => ({ pipeline, ...v }))
      .sort((a, b) => b.runs - a.runs),
  };
}
