/**
 * Context Budget Manager (Sprint 5.1, 06_AI_Architecture §Context Budget Manager). The NEW
 * component that owns truncation: builders no longer truncate independently. Given the assembled
 * snapshots and a hard token budget, it orders by priority and drops (or partially trims) the
 * lowest-priority snapshots first until everything fits, noting what was truncated. Pure.
 */
import { DEFAULTS } from "../config/defaults";
import type { Snapshot } from "./snapshot";

export interface BudgetResult {
  /** Snapshots that fit, highest priority first. */
  included: Snapshot[];
  /** Builder names fully dropped. */
  dropped: string[];
  /** Total tokens of the included set. */
  totalTokens: number;
  /** The budget applied. */
  budget: number;
}

/**
 * Allocate snapshots within `budget` tokens. Highest priority kept first; ties broken by builder
 * name for determinism. Snapshots that don't fit whole are dropped (partial trimming of a snapshot's
 * data is a feature-sprint refinement — 5.1 drops whole low-priority snapshots).
 */
export function allocateBudget(
  snapshots: readonly Snapshot[],
  budget: number = DEFAULTS.contextTokenBudget,
): BudgetResult {
  const ordered = [...snapshots].sort(
    (a, b) => b.priority - a.priority || a.builder.localeCompare(b.builder),
  );
  const included: Snapshot[] = [];
  const dropped: string[] = [];
  let total = 0;
  for (const snap of ordered) {
    if (total + snap.tokenEstimate <= budget) {
      included.push(snap);
      total += snap.tokenEstimate;
    } else {
      dropped.push(snap.builder);
    }
  }
  return { included, dropped, totalTokens: total, budget };
}
