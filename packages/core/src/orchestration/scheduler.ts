import type { PipelineKind } from "./constants";
import type { OrchestrationRun } from "./types";

/**
 * Orchestration scheduler (Sprint 3.5). PURE — no timers. Decides whether a pipeline
 * run should proceed now, given recent run history. Deduplicates repeated identical
 * runs (same pipeline + trigger) within a short window so a burst of the same event
 * doesn't regenerate everything repeatedly. Deterministic.
 */
const DEDUP_WINDOW_MS = 5_000;

export type RunDecision = "run" | "dedup" | "skip";

export interface RunScheduleResult {
  decision: RunDecision;
  reason: string;
}

export function scheduleRun(
  pipeline: PipelineKind,
  trigger: string,
  now: Date,
  history: OrchestrationRun[],
): RunScheduleResult {
  const nowMs = now.getTime();
  const recent = history.find(
    (r) =>
      r.pipeline === pipeline &&
      r.trigger === trigger &&
      nowMs - Date.parse(r.startedAt) < DEDUP_WINDOW_MS,
  );
  if (recent) {
    return { decision: "dedup", reason: "Identical run within the dedup window." };
  }
  return { decision: "run", reason: "Ready to orchestrate." };
}
