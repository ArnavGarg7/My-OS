import type { DayReview, DayReviewInput } from "./types";

/**
 * Review engine (Sprint 3.1). Deterministically summarises today's execution from
 * inputs the server gathers (Today/Task/Planner/Decision/Calendar/Goal/Health/
 * Journal). No AI — the completion score and headline are pure functions.
 */
function clamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

export function buildDayReview(input: DayReviewInput, planningDate: string): DayReview {
  const totalTasks = input.tasksCompleted + input.tasksCreated;
  const taskCompletion = totalTasks > 0 ? (input.tasksCompleted / totalTasks) * 100 : 0;

  // Completion score blends task completion with planner adherence.
  const completionScore = clamp(taskCompletion * 0.6 + input.plannerAccuracy * 0.4);

  const headline =
    completionScore >= 80
      ? "A strong day — most of what you planned got done."
      : completionScore >= 50
        ? "A solid day with room to carry a few things forward."
        : "A lighter day — plenty to move into tomorrow.";

  return {
    planningDate,
    tasksCompleted: input.tasksCompleted,
    tasksCreated: input.tasksCreated,
    completionScore,
    plannerAccuracy: clamp(input.plannerAccuracy),
    decisionsAccepted: input.decisionsAccepted,
    deepWorkMinutes: input.deepWorkMinutes,
    calendarCompletion: clamp(input.calendarCompletion),
    goalProgress: clamp(input.goalProgress),
    healthReadiness: clamp(input.healthReadiness),
    journalCompleted: input.journalCompleted,
    headline,
  };
}
