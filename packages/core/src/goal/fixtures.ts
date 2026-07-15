import { goalEngine } from "./engine";
import type { Goal, GoalReview, Habit, KeyResult, Objective } from "./types";

/** Test fixtures for the goal engine (imported by *.test.ts). */
export const at = (y: number, mo: number, d: number, h = 12) =>
  new Date(Date.UTC(y, mo, d, h, 0, 0)).toISOString();
export const day = (y: number, mo: number, d: number) =>
  new Date(Date.UTC(y, mo, d)).toISOString().slice(0, 10);

export function makeKeyResult(over: Partial<KeyResult> = {}): KeyResult {
  return {
    id: over.id ?? "kr1",
    objectiveId: over.objectiveId ?? "o1",
    title: over.title ?? "CGPA",
    metricType: over.metricType ?? "numeric",
    currentValue: over.currentValue ?? 8.9,
    targetValue: over.targetValue ?? 9,
    unit: over.unit ?? "",
    status: over.status ?? "active",
  };
}

export function makeObjective(over: Partial<Objective> = {}): Objective {
  return {
    id: over.id ?? "o1",
    goalId: over.goalId ?? "g1",
    title: over.title ?? "Excel academically",
    description: over.description ?? "",
    weight: over.weight ?? 1,
    status: over.status ?? "active",
    keyResults: over.keyResults ?? [makeKeyResult()],
  };
}

export function makeHabit(over: Partial<Habit> = {}): Habit {
  return {
    id: over.id ?? "h1",
    goalId: over.goalId ?? "g1",
    title: over.title ?? "Study 2h",
    frequency: over.frequency ?? "daily",
    target: over.target ?? 1,
    currentStreak: over.currentStreak ?? 0,
    longestStreak: over.longestStreak ?? 0,
    lastCompleted: over.lastCompleted ?? null,
    active: over.active ?? true,
    history: over.history ?? [],
  };
}

export function makeGoal(over: Partial<Goal> = {}): Goal {
  const base = goalEngine.create(
    { title: over.title ?? "Graduate with honours" },
    new Date(over.createdAt ?? at(2026, 0, 1)),
  );
  return {
    ...base,
    ...over,
    id: over.id ?? "g1",
    objectives: over.objectives ?? [],
    habits: over.habits ?? [],
    links: over.links ?? [],
    createdAt: over.createdAt ?? at(2026, 0, 1),
    updatedAt: over.updatedAt ?? at(2026, 0, 1),
  };
}

export function makeReview(over: Partial<GoalReview> = {}): GoalReview {
  return {
    id: over.id ?? "rv1",
    goalId: over.goalId ?? "g1",
    reviewPeriod: over.reviewPeriod ?? "quarterly",
    summary: over.summary ?? "Solid progress.",
    progressSnapshot: over.progressSnapshot ?? 50,
    reviewedAt: over.reviewedAt ?? at(2026, 2, 25),
  };
}
