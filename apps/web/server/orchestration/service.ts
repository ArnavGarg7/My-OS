import "server-only";
import { randomUUID } from "node:crypto";
import {
  createOrchestrationEngine,
  type ExecutionPlan,
  type OrchestrationContext,
  type OrchestrationRun,
  type TriggerSource,
} from "@myos/core/orchestration";
import type { Database } from "@myos/db";
import * as timelineService from "../timeline/service";
import { executePlan, type ExecutorContext } from "./executor";
import * as repo from "./repository";

/**
 * OrchestrationService (Sprint 3.5). Bridges the pure OrchestrationEngine with
 * persistence + the real services. `run` resolves an event to a pipeline, builds the
 * deterministic plan, executes each step through EXISTING services with recovery,
 * assembles the run record and persists it. Orchestration coordinates only — it never
 * implements any module's feature logic.
 */
export interface OrchestrationPrefs {
  preferredStartOfDay: string;
  preferredEndOfDay: string;
}

const engine = createOrchestrationEngine(() => randomUUID());

function context(): OrchestrationContext {
  return { now: new Date(), unavailable: [] };
}

/** Fire a pipeline for an event. Returns the persisted run, or null if no pipeline matches. */
export async function run(
  db: Database,
  tz: string,
  prefs: OrchestrationPrefs,
  event: string,
  source: TriggerSource = "manual",
  payload: Record<string, unknown> = {},
): Promise<OrchestrationRun | null> {
  const trigger = engine.makeTrigger(event, source, payload);
  if (!trigger) return null;

  const plan = engine.plan(trigger, context());
  const startedAt = new Date();

  const execCtx: ExecutorContext = { db, tz, prefs };
  const { steps, failures, recoveries } = await executePlan(plan, execCtx);
  const assembled = engine.assemble(trigger, plan, steps, startedAt);

  const saved = await repo.saveRun(db, assembled, failures, recoveries);
  await recordTimeline(db, saved);
  return saved;
}

/** Dry-run preview — the plan an event WOULD produce, no execution, nothing persisted. */
export function preview(event: string): ExecutionPlan | null {
  return engine.preview(event, context());
}

export function history(db: Database, pipeline: string | undefined, limit: number) {
  return repo.listRuns(db, pipeline, limit);
}

export function getRun(db: Database, id: string) {
  return repo.getRun(db, id);
}

export function failures(db: Database, limit: number) {
  return repo.listFailures(db, limit);
}

async function recordTimeline(db: Database, run: OrchestrationRun): Promise<void> {
  const eventType =
    run.status === "failed"
      ? "orchestration.failed"
      : run.status === "recovered"
        ? "orchestration.recovered"
        : "orchestration.completed";
  await timelineService
    .record(db, {
      eventType,
      source: "orchestration",
      entityId: run.id,
      title: run.summary,
      summary: run.summary,
      importance: run.status === "failed" ? 3 : 1,
      metadata: {
        pipeline: run.pipeline,
        affected: run.affected.length,
        failures: run.failures,
        recoveries: run.recoveries,
      },
    })
    .catch(() => undefined);
}
