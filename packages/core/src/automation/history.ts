import type { ActionKind, ExecutionOutcome } from "./constants";
import type { ExecutionRecord } from "./types";

/**
 * Automation history (Sprint 3.4). Pure builders for execution records — the server
 * persists them; statistics derive from them. Append-only.
 */
export function startRecord(id: string, ruleId: string, now: Date): ExecutionRecord {
  return {
    id,
    ruleId,
    outcome: "triggered",
    triggeredAt: now.toISOString(),
    completedAt: null,
    runtimeMs: null,
    actionResults: [],
    error: null,
  };
}

export function completeRecord(
  record: ExecutionRecord,
  now: Date,
  actionResults: { actionId: string; kind: ActionKind; ok: boolean; detail?: string }[],
): ExecutionRecord {
  const allOk = actionResults.every((r) => r.ok);
  const runtimeMs = Math.max(0, now.getTime() - Date.parse(record.triggeredAt));
  return {
    ...record,
    outcome: allOk ? "completed" : "failed",
    completedAt: now.toISOString(),
    runtimeMs,
    actionResults,
    error: allOk ? null : "One or more actions failed.",
  };
}

export function outcomeRecord(
  record: ExecutionRecord,
  outcome: ExecutionOutcome,
  now: Date,
  reason?: string,
): ExecutionRecord {
  return {
    ...record,
    outcome,
    completedAt: now.toISOString(),
    runtimeMs: Math.max(0, now.getTime() - Date.parse(record.triggeredAt)),
    error: outcome === "failed" ? (reason ?? "Failed.") : null,
  };
}
