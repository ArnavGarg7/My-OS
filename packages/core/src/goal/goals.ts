import type { GoalPriority, GoalType } from "./constants";
import type { Goal } from "./types";

/**
 * Goal lifecycle (Sprint 2.12). Pure create / update / status transitions. No
 * persistence — the service assigns ids + timestamps at the boundary.
 */
export interface CreateGoalInput {
  title: string;
  description?: string | undefined;
  goalType?: GoalType | undefined;
  priority?: GoalPriority | undefined;
  targetDate?: string | null | undefined;
}

export function createGoal(input: CreateGoalInput, now: Date): Goal {
  const iso = now.toISOString();
  return {
    id: "",
    title: input.title.trim(),
    description: input.description?.trim() ?? "",
    goalType: input.goalType ?? "personal",
    status: "planned",
    priority: input.priority ?? "medium",
    targetDate: input.targetDate ?? null,
    startedAt: null,
    completedAt: null,
    createdAt: iso,
    updatedAt: iso,
    objectives: [],
    habits: [],
    links: [],
  };
}

export function validateGoal(goal: Goal): string[] {
  const errors: string[] = [];
  if (!goal.title.trim()) errors.push("A goal needs a title.");
  if (
    goal.startedAt &&
    goal.targetDate &&
    new Date(goal.targetDate).getTime() < new Date(goal.startedAt).getTime()
  )
    errors.push("Target date must be on or after the start date.");
  return errors;
}

export function activateGoal(goal: Goal, now: Date): Goal {
  return {
    ...goal,
    status: "active",
    startedAt: goal.startedAt ?? now.toISOString(),
    updatedAt: now.toISOString(),
  };
}

export function completeGoal(goal: Goal, now: Date): Goal {
  return {
    ...goal,
    status: "completed",
    completedAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };
}

export function archiveGoal(goal: Goal, now: Date): Goal {
  return { ...goal, status: "archived", updatedAt: now.toISOString() };
}

export function setStatus(goal: Goal, status: Goal["status"], now: Date): Goal {
  if (status === "completed") return completeGoal(goal, now);
  if (status === "archived") return archiveGoal(goal, now);
  if (status === "active") return activateGoal(goal, now);
  return { ...goal, status, updatedAt: now.toISOString() };
}
