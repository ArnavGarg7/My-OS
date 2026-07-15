import { CARRY_FORWARD_KINDS, OVERLOADED_CARRY_FORWARD, type CarryForwardKind } from "./constants";
import type { CarryForwardCandidate, CarryForwardList } from "./types";

/**
 * Carry-forward engine (Sprint 3.1). Collects unfinished work — overdue tasks,
 * unfinished planner blocks, incomplete milestones, active decisions, unresolved
 * inbox items — into an ordered list. NOTHING moves automatically: the user
 * confirms each item explicitly. Deterministic ordering.
 */
const KIND_ORDER: Record<CarryForwardKind, number> = {
  task: 0,
  milestone: 1,
  decision: 2,
  planner_block: 3,
  inbox: 4,
};

const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 } as const;

export function collectCarryForward(candidates: CarryForwardCandidate[]): CarryForwardList {
  const items = candidates.slice().sort((a, b) => {
    if (a.kind !== b.kind) return KIND_ORDER[a.kind] - KIND_ORDER[b.kind];
    const pa = PRIORITY_ORDER[a.priority ?? "medium"];
    const pb = PRIORITY_ORDER[b.priority ?? "medium"];
    if (pa !== pb) return pa - pb;
    return a.title < b.title ? -1 : a.title > b.title ? 1 : 0;
  });

  const byKind = Object.fromEntries(CARRY_FORWARD_KINDS.map((k) => [k, 0])) as Record<
    CarryForwardKind,
    number
  >;
  for (const c of items) byKind[c.kind] += 1;

  return {
    items,
    byKind,
    total: items.length,
    overloaded: items.length > OVERLOADED_CARRY_FORWARD,
  };
}

/** Confirm a subset of candidates by id (the only way work moves forward). */
export function confirmCarryForward(
  list: CarryForwardList,
  acceptedIds: string[],
): CarryForwardCandidate[] {
  const accepted = new Set(acceptedIds);
  return list.items.filter((c) => accepted.has(c.id));
}
