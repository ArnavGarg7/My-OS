/**
 * Audit Trail + Analytics (Sprint 6.3, spec §Audit Trail / §Automation Analytics). Pure builders:
 * an immutable, replayable timeline of an automation's lifecycle, and aggregate metrics over past
 * executions. No IO.
 */
import type { AuditEvent, AutomationAnalytics, AutomationState } from "./types";

/** Append an audit event (returns a new array — never mutates). */
export function appendAudit(trail: readonly AuditEvent[], event: AuditEvent): AuditEvent[] {
  return [...trail, event];
}

/** Build the canonical lifecycle trail from a sequence of state changes + their times. */
export function buildAuditTrail(
  entries: readonly { state: AuditEvent["state"]; at: string; detail?: string }[],
): AuditEvent[] {
  return entries.map((e) => ({ at: e.at, state: e.state, detail: e.detail ?? label(e.state) }));
}

function label(state: AuditEvent["state"]): string {
  switch (state) {
    case "proposal_created":
      return "Proposal created";
    case "approved":
      return "User approved";
    case "executing":
      return "Execution started";
    case "completed":
      return "Completed";
    case "verification_passed":
      return "Verification passed";
    case "verification_failed":
      return "Verification failed";
    case "rejected":
      return "Rejected";
    case "failed":
      return "Execution failed";
    case "rolled_back":
      return "Rolled back";
    default:
      return String(state);
  }
}

/** One historical execution record the analytics reads. */
export interface ExecutionRecord {
  state: AutomationState;
  trusted: boolean;
}

/** Compute aggregate analytics from execution records. Deterministic. */
export function computeAnalytics(records: readonly ExecutionRecord[]): AutomationAnalytics {
  const proposals = records.length;
  const approved = records.filter(
    (r) => r.state !== "pending_approval" && r.state !== "rejected" && r.state !== "draft",
  ).length;
  const executed = records.filter((r) => r.state === "completed").length;
  const rolledBack = records.filter((r) => r.state === "rolled_back").length;
  const failed = records.filter((r) => r.state === "failed" || r.state === "rolled_back").length;
  const trustedUsage = records.filter((r) => r.trusted).length;
  const attempted = records.filter(
    (r) => r.state === "completed" || r.state === "failed" || r.state === "rolled_back",
  ).length;
  const rate = (n: number, d: number) => (d === 0 ? 0 : Math.round((n / d) * 100) / 100);
  return {
    proposals,
    approved,
    executed,
    rolledBack,
    failed,
    approvalRate: rate(approved, proposals),
    executionSuccessRate: rate(executed, attempted),
    rollbackRate: rate(rolledBack, attempted),
    trustedUsage,
  };
}
