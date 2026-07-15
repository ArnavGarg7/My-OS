import { clampScore, countKind } from "./metrics";
import type { GoalAnalyticsInput } from "./types";
import type { TimelineEvent } from "../timeline";

/**
 * Goal analytics (Sprint 2.14). Velocity (goal-advancing events / week) from the
 * Timeline + a 0–100 goal score from progress, habit consistency and completion
 * rate (from the Goal engine's portfolio). Deterministic.
 */
export interface GoalMetrics {
  activeCount: number;
  overallProgress: number; // 0–100
  objectivesCompleted: number;
  habitConsistency: number; // 0–100
  completionRate: number; // 0–100
  forecastAccuracy: number; // 0–100
  velocity: number; // goal/objective/habit events per week
  score: number; // 0–100
}

/** Goal-advancing events in the window (habits, objectives, completions, reviews). */
export function goalVelocity(events: TimelineEvent[], spanDays: number): number {
  const advancing =
    countKind(events, "habit.completed") +
    countKind(events, "objective.completed") +
    countKind(events, "goal.completed") +
    countKind(events, "goal.review_completed");
  const weeks = Math.max(1, spanDays / 7);
  return Math.round((advancing / weeks) * 10) / 10;
}

export function computeGoals(
  events: TimelineEvent[],
  spanDays: number,
  input?: GoalAnalyticsInput,
): GoalMetrics {
  const g = input ?? {
    activeCount: 0,
    overallProgress: 0,
    objectivesCompleted: 0,
    habitConsistency: 0,
    completionRate: 0,
    forecastAccuracy: 0,
  };
  const score = clampScore(
    g.overallProgress * 0.5 + g.habitConsistency * 0.3 + g.completionRate * 0.2,
  );
  return {
    activeCount: g.activeCount,
    overallProgress: clampScore(g.overallProgress),
    objectivesCompleted: g.objectivesCompleted,
    habitConsistency: clampScore(g.habitConsistency),
    completionRate: clampScore(g.completionRate),
    forecastAccuracy: clampScore(g.forecastAccuracy),
    velocity: goalVelocity(events, spanDays),
    score,
  };
}
