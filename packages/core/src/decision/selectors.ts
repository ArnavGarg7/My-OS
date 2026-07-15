import { PRIORITY_RANK, type DecisionState } from "./constants";
import type { Decision } from "./types";

/**
 * Decision selectors (Sprint 2.3). Pure derivations: ranking + the current
 * decision + the status label for the shell.
 */

/** Rank by priority, then score, then rule id (stable + deterministic). */
export function rankDecisions(decisions: Decision[]): Decision[] {
  return [...decisions].sort((a, b) => {
    const byPriority = PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
    if (byPriority !== 0) return byPriority;
    if (b.score !== a.score) return b.score - a.score;
    return a.ruleId.localeCompare(b.ruleId);
  });
}

export function selectByState(decisions: Decision[], state: DecisionState): Decision[] {
  return decisions.filter((d) => d.state === state);
}

export function selectPending(decisions: Decision[]): Decision[] {
  return rankDecisions(selectByState(decisions, "pending"));
}

/** The single decision the OS is surfacing right now (top pending). */
export function selectCurrentDecision(decisions: Decision[]): Decision | null {
  return selectPending(decisions)[0] ?? null;
}

/** Newest-first history. */
export function selectHistory(decisions: Decision[]): Decision[] {
  return [...decisions].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export type DecisionStatusLabel = "idle" | "pending" | "accepted" | "deferred";

/** The status-bar label for the day's decisions. */
export function selectDecisionStatus(decisions: Decision[]): DecisionStatusLabel {
  if (selectByState(decisions, "pending").length > 0) return "pending";
  if (selectByState(decisions, "accepted").length > 0) return "accepted";
  if (selectByState(decisions, "deferred").length > 0) return "deferred";
  return "idle";
}
