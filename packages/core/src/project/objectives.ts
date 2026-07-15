import type { Objective } from "./types";

/**
 * Objective helpers (Sprint 2.8). Numeric key results — current/target with a
 * unit. Deterministic percent, clamped 0–100.
 */
export function objectiveProgress(objective: Objective): number {
  if (objective.completed) return 100;
  if (objective.targetValue <= 0) return 0;
  return Math.max(
    0,
    Math.min(100, Math.round((objective.currentValue / objective.targetValue) * 100)),
  );
}

/** Update an objective's current value; auto-complete when it hits the target. */
export function updateObjective(objective: Objective, currentValue: number): Objective {
  const next = Math.max(0, currentValue);
  return { ...objective, currentValue: next, completed: next >= objective.targetValue };
}

export function objectivesAverage(objectives: Objective[]): number {
  if (objectives.length === 0) return 0;
  const sum = objectives.reduce((acc, o) => acc + objectiveProgress(o), 0);
  return Math.round(sum / objectives.length);
}

export function missedObjectives(objectives: Objective[]): Objective[] {
  return objectives.filter((o) => !o.completed && objectiveProgress(o) < 50);
}
