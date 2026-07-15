import { OPEN_GOAL_STATUSES, PRIORITY_WEIGHT, type GoalStatus, type GoalType } from "./constants";
import { goalProgress } from "./progress";
import type { Goal } from "./types";

/**
 * Goal selectors + search (Sprint 2.12). Pure read helpers and deterministic
 * keyword search over title/description.
 */
export type GoalSort = "priority" | "progress" | "target" | "title";

export interface GoalFilter {
  status?: GoalStatus | undefined;
  goalType?: GoalType | undefined;
}

export function selectActive(goals: Goal[]): Goal[] {
  return goals.filter((g) => OPEN_GOAL_STATUSES.includes(g.status));
}

export function filterGoals(goals: Goal[], filter: GoalFilter): Goal[] {
  return goals.filter((g) => {
    if (filter.status && g.status !== filter.status) return false;
    if (filter.goalType && g.goalType !== filter.goalType) return false;
    return true;
  });
}

export function sortGoals(goals: Goal[], sort: GoalSort): Goal[] {
  const copy = [...goals];
  switch (sort) {
    case "priority":
      return copy.sort(
        (a, b) =>
          PRIORITY_WEIGHT[b.priority] - PRIORITY_WEIGHT[a.priority] ||
          a.title.localeCompare(b.title),
      );
    case "progress":
      return copy.sort((a, b) => goalProgress(b).overall - goalProgress(a).overall);
    case "target":
      return copy.sort((a, b) => (a.targetDate ?? "").localeCompare(b.targetDate ?? ""));
    case "title":
    default:
      return copy.sort((a, b) => a.title.localeCompare(b.title));
  }
}

export function searchGoals(goals: Goal[], query: string): Goal[] {
  const q = query.trim().toLowerCase();
  if (!q) return goals;
  return goals.filter(
    (g) => g.title.toLowerCase().includes(q) || g.description.toLowerCase().includes(q),
  );
}

/** The highest-priority active goal (for Today / status bar). */
export function topGoal(goals: Goal[]): Goal | null {
  return sortGoals(selectActive(goals), "priority")[0] ?? null;
}
