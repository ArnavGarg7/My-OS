import { PROGRESS_WEIGHTS } from "./constants";
import { weightedObjectivesProgress } from "./objectives";
import { habitsProgress } from "./habits";
import type { Goal, GoalProgress } from "./types";

/**
 * Progress engine (Sprint 2.12). A goal's overall progress is a deterministic
 * blend of its weighted objectives and its habit completion. Nothing stored.
 */
export function goalProgress(goal: Goal): GoalProgress {
  if (goal.status === "completed") {
    return {
      goalId: goal.id,
      overall: 100,
      objectivesPercent: 100,
      habitsPercent: 100,
      completedObjectives: goal.objectives.length,
      totalObjectives: goal.objectives.length,
    };
  }

  const objectivesPercent = weightedObjectivesProgress(goal.objectives);
  const habitsPercent = habitsProgress(goal.habits);
  const hasObjectives = goal.objectives.length > 0;
  const hasHabits = goal.habits.some((h) => h.active);

  let overall: number;
  if (hasObjectives && hasHabits) {
    overall = Math.round(
      objectivesPercent * PROGRESS_WEIGHTS.objectives + habitsPercent * PROGRESS_WEIGHTS.habits,
    );
  } else if (hasObjectives) {
    overall = objectivesPercent;
  } else if (hasHabits) {
    overall = habitsPercent;
  } else {
    overall = 0;
  }

  return {
    goalId: goal.id,
    overall,
    objectivesPercent,
    habitsPercent,
    completedObjectives: goal.objectives.filter((o) => o.status === "completed").length,
    totalObjectives: goal.objectives.length,
  };
}
