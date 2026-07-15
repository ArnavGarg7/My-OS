import type { GoalLinkTarget } from "./constants";
import type { Goal, GoalLink } from "./types";

/**
 * Hierarchy engine (Sprint 2.12). The canonical strategic chain:
 *   Life Goal → Objective → Key Result → Project → Milestone → Task.
 * Goals link to projects/tasks/journal/finance/health by id (no duplication);
 * a project may contribute to multiple goals through explicit links.
 */
export function addLink(goal: Goal, target: GoalLinkTarget, targetId: string): Goal {
  if (goal.links.some((l) => l.target === target && l.targetId === targetId)) return goal;
  return { ...goal, links: [...goal.links, { target, targetId }] };
}

export function removeLink(goal: Goal, target: GoalLinkTarget, targetId: string): Goal {
  return {
    ...goal,
    links: goal.links.filter((l) => !(l.target === target && l.targetId === targetId)),
  };
}

export function linksOfType(goal: Goal, target: GoalLinkTarget): string[] {
  return goal.links.filter((l) => l.target === target).map((l) => l.targetId);
}

export function linkedProjectIds(goal: Goal): string[] {
  return linksOfType(goal, "project");
}

/** All goals that link to a given project (a project can serve many goals). */
export function goalsForProject(goals: Goal[], projectId: string): Goal[] {
  return goals.filter((g) =>
    g.links.some((l) => l.target === "project" && l.targetId === projectId),
  );
}

/** Flatten a goal's links into {target, targetId} pairs (for the UI). */
export function allLinks(goal: Goal): GoalLink[] {
  return goal.links;
}

export function totalKeyResults(goal: Goal): number {
  return goal.objectives.reduce((sum, o) => sum + o.keyResults.length, 0);
}
