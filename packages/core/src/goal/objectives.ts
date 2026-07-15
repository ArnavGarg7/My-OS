import { analyzeKeyResult, keyResultProgress } from "./key-results";
import type { Objective, ObjectiveProgress } from "./types";

/**
 * Objective engine (Sprint 2.12). An objective's progress is the mean of its key
 * results (or its completed flag). Deterministic — nothing stored redundantly.
 */
export function objectiveProgress(objective: Objective): number {
  if (objective.status === "completed") return 100;
  if (objective.keyResults.length === 0) return 0;
  const sum = objective.keyResults.reduce((acc, kr) => acc + keyResultProgress(kr), 0);
  return Math.round(sum / objective.keyResults.length);
}

export function isObjectiveComplete(objective: Objective): boolean {
  return objective.status === "completed" || objectiveProgress(objective) >= 100;
}

export function analyzeObjective(objective: Objective): ObjectiveProgress {
  const progressPercent = objectiveProgress(objective);
  return {
    objective,
    progressPercent,
    keyResults: objective.keyResults.map(analyzeKeyResult),
    complete: progressPercent >= 100,
  };
}

/** Weighted mean progress across a set of objectives (weights ≥ 0). */
export function weightedObjectivesProgress(objectives: Objective[]): number {
  if (objectives.length === 0) return 0;
  const totalWeight = objectives.reduce((sum, o) => sum + Math.max(0, o.weight), 0);
  if (totalWeight === 0) {
    // Fall back to a simple mean when no weights are set.
    return Math.round(objectives.reduce((s, o) => s + objectiveProgress(o), 0) / objectives.length);
  }
  const weighted = objectives.reduce(
    (sum, o) => sum + objectiveProgress(o) * Math.max(0, o.weight),
    0,
  );
  return Math.round(weighted / totalWeight);
}

export function completeObjective(objective: Objective): Objective {
  return { ...objective, status: "completed" };
}
