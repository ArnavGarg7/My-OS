import { OPEN_GOAL_STATUSES, QUARTER_REVIEW_WINDOW_DAYS } from "./constants";
import {
  activateGoal,
  archiveGoal,
  completeGoal,
  createGoal,
  setStatus,
  validateGoal,
  type CreateGoalInput,
} from "./goals";
import { goalProgress } from "./progress";
import { forecastGoal } from "./forecasting";
import { analyzeHabit } from "./habits";
import { selectActive } from "./selectors";
import type { Goal, GoalPortfolio, GoalSignals, GoalSummaryItem } from "./types";

/**
 * GoalEngine (Sprint 2.12). Pure deterministic orchestration over the goal
 * sub-engines. Progress / forecast / portfolio / signals are always derived.
 * No React, DB, browser or randomness. Goals are outcomes, not work.
 */
const DAY_MS = 86_400_000;

export class GoalEngine {
  create(input: CreateGoalInput, now: Date): Goal {
    return createGoal(input, now);
  }
  validate(goal: Goal): string[] {
    return validateGoal(goal);
  }
  activate(goal: Goal, now: Date): Goal {
    return activateGoal(goal, now);
  }
  complete(goal: Goal, now: Date): Goal {
    return completeGoal(goal, now);
  }
  archive(goal: Goal, now: Date): Goal {
    return archiveGoal(goal, now);
  }
  setStatus(goal: Goal, status: Goal["status"], now: Date): Goal {
    return setStatus(goal, status, now);
  }

  progress(goal: Goal) {
    return goalProgress(goal);
  }
  forecast(goal: Goal, now: Date) {
    return forecastGoal(goal, now);
  }

  summary(goal: Goal, now: Date): GoalSummaryItem {
    return { goal, progress: goalProgress(goal), forecast: forecastGoal(goal, now) };
  }

  portfolio(goals: Goal[], now: Date): GoalPortfolio {
    const active = selectActive(goals);
    const overall =
      active.length === 0
        ? 0
        : Math.round(active.reduce((s, g) => s + goalProgress(g).overall, 0) / active.length);
    const behindCount = active.filter((g) => forecastGoal(g, now).status === "behind").length;
    const bestStreak = Math.max(
      0,
      ...goals.flatMap((g) =>
        g.habits.filter((h) => h.active).map((h) => analyzeHabit(h, now).habit.currentStreak),
      ),
    );

    return {
      activeCount: active.length,
      overallProgress: overall,
      behindCount,
      habitStreak: bestStreak,
      nextMilestone: nextMilestone(active, now),
    };
  }

  signals(goals: Goal[], now: Date): GoalSignals {
    const active = selectActive(goals);
    const behindGoals = active
      .filter((g) => forecastGoal(g, now).status === "behind")
      .map((g) => ({ title: g.title, progress: goalProgress(g).overall }));
    const habitsAtRisk = goals
      .flatMap((g) => g.habits)
      .filter((h) => h.active && analyzeHabit(h, now).atRisk)
      .map((h) => ({ title: h.title }));
    const bestHabitStreak = Math.max(
      0,
      ...goals.flatMap((g) =>
        g.habits.filter((h) => h.active).map((h) => analyzeHabit(h, now).habit.currentStreak),
      ),
    );

    return {
      activeCount: active.length,
      overallProgress: this.portfolio(goals, now).overallProgress,
      behindGoals,
      habitsAtRisk,
      bestHabitStreak,
      quarterEnding: isQuarterEnding(now),
    };
  }
}

/** The nearest goal target date within the active set. */
function nextMilestone(active: Goal[], now: Date): GoalPortfolio["nextMilestone"] {
  const dated = active
    .filter((g) => g.targetDate)
    .map((g) => ({
      goalTitle: g.title,
      title: g.title,
      dueInDays: Math.ceil((new Date(g.targetDate!).getTime() - now.getTime()) / DAY_MS),
    }))
    .filter((m) => m.dueInDays >= 0)
    .sort((a, b) => a.dueInDays - b.dueInDays);
  return dated[0] ?? null;
}

/** True within the review window before a quarter boundary (Mar/Jun/Sep/Dec end). */
export function isQuarterEnding(now: Date): boolean {
  const month = now.getMonth();
  const isQuarterEndMonth = month === 2 || month === 5 || month === 8 || month === 11;
  if (!isQuarterEndMonth) return false;
  const endOfMonth = new Date(now.getFullYear(), month + 1, 0).getDate();
  return endOfMonth - now.getDate() <= QUARTER_REVIEW_WINDOW_DAYS;
}

export const goalEngine = new GoalEngine();
export { OPEN_GOAL_STATUSES };
