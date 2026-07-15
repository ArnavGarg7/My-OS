import { MAX_PRIORITIES, PRIORITY_WEIGHTS, TOP_PRIORITIES } from "./constants";
import type { PriorityCandidate, PrioritySelection, RankedPriority } from "./types";

/**
 * Priority engine (Sprint 3.1). Deterministically ranks tomorrow's priorities
 * from task priority, project urgency, goal deadlines, planner overflow, decision
 * importance and calendar load. Pure weighted scoring — reproducible, no AI.
 */
export function priorityScore(c: PriorityCandidate): number {
  return (
    Math.round(
      ((c.taskPriority ?? 0) * PRIORITY_WEIGHTS.taskPriority +
        (c.projectUrgency ?? 0) * PRIORITY_WEIGHTS.projectUrgency +
        (c.goalDeadline ?? 0) * PRIORITY_WEIGHTS.goalDeadline +
        (c.plannerOverflow ?? 0) * PRIORITY_WEIGHTS.plannerOverflow +
        (c.decisionImportance ?? 0) * PRIORITY_WEIGHTS.decisionImportance +
        (c.calendarLoad ?? 0) * PRIORITY_WEIGHTS.calendarLoad) *
        10,
    ) / 10
  );
}

export function rankPriorities(candidates: PriorityCandidate[]): PrioritySelection {
  const ranked: RankedPriority[] = candidates
    .map((c) => ({ ...c, score: priorityScore(c), rank: 0 }))
    .sort((a, b) => (b.score !== a.score ? b.score - a.score : a.title < b.title ? -1 : 1))
    .map((c, i) => ({ ...c, rank: i + 1 }));

  return {
    ranked,
    top: ranked.slice(0, TOP_PRIORITIES),
    optional: ranked.slice(TOP_PRIORITIES, MAX_PRIORITIES),
  };
}

/** The explicitly-selected priorities (by id), preserving rank order. */
export function selectPriorities(
  selection: PrioritySelection,
  chosenIds: string[],
): RankedPriority[] {
  const chosen = new Set(chosenIds);
  return selection.ranked.filter((p) => chosen.has(p.id)).slice(0, MAX_PRIORITIES);
}
