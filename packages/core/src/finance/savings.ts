import { SAVINGS_NEARLY_DONE } from "./constants";
import type { SavingsGoal, SavingsProgress } from "./types";

/**
 * Savings engine (Sprint 2.11). Deterministic progress, remaining and a
 * projected completion date from the recent contribution rate. Rule-based.
 */
const DAY_MS = 86_400_000;

export function progressPercent(goal: SavingsGoal): number {
  if (goal.targetAmount <= 0) return 0;
  return Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100));
}

export function remaining(goal: SavingsGoal): number {
  return round(Math.max(0, goal.targetAmount - goal.currentAmount));
}

export function isComplete(goal: SavingsGoal): boolean {
  return goal.completedAt !== null || goal.currentAmount >= goal.targetAmount;
}

export function isNearlyComplete(goal: SavingsGoal): boolean {
  return (
    !isComplete(goal) &&
    goal.targetAmount > 0 &&
    goal.currentAmount / goal.targetAmount >= SAVINGS_NEARLY_DONE
  );
}

/**
 * Project a completion date from an average monthly contribution. Returns null
 * when there's no contribution rate to extrapolate from.
 */
export function projectCompletion(
  goal: SavingsGoal,
  monthlyContribution: number,
  now: Date,
): string | null {
  if (isComplete(goal)) return now.toISOString().slice(0, 10);
  if (monthlyContribution <= 0) return null;
  const months = Math.ceil(remaining(goal) / monthlyContribution);
  const date = new Date(now.getTime() + months * 30 * DAY_MS);
  return date.toISOString().slice(0, 10);
}

export function savingsProgress(
  goal: SavingsGoal,
  monthlyContribution: number,
  now: Date,
): SavingsProgress {
  const projectedCompletion = projectCompletion(goal, monthlyContribution, now);
  const onTrack =
    goal.deadline === null ||
    projectedCompletion === null ||
    new Date(projectedCompletion).getTime() <= new Date(goal.deadline).getTime();
  return {
    goal,
    progressPercent: progressPercent(goal),
    remaining: remaining(goal),
    projectedCompletion,
    onTrack: isComplete(goal) ? true : onTrack,
  };
}

/** Apply a contribution to a goal, completing it when the target is reached. */
export function contribute(goal: SavingsGoal, amount: number, now: Date): SavingsGoal {
  const currentAmount = round(goal.currentAmount + Math.max(0, amount));
  return {
    ...goal,
    currentAmount,
    completedAt: currentAmount >= goal.targetAmount ? now.toISOString() : goal.completedAt,
  };
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}
