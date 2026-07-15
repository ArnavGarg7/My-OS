import { AHEAD_PACE_RATIO, BEHIND_PACE_RATIO } from "./constants";
import { goalProgress } from "./progress";
import type { Goal, GoalForecast } from "./types";

/**
 * Forecast engine (Sprint 2.12). Rule-based, deterministic — velocity from
 * progress achieved over elapsed days, an estimated completion date, and an
 * ahead/on-track/behind status vs the target date. No ML.
 */
const DAY_MS = 86_400_000;

export function forecastGoal(goal: Goal, now: Date): GoalForecast {
  const progress = goalProgress(goal).overall;
  const start = goal.startedAt
    ? new Date(goal.startedAt).getTime()
    : new Date(goal.createdAt).getTime();
  const elapsedDays = Math.max(1, Math.round((now.getTime() - start) / DAY_MS));
  const velocityPerDay = Math.round((progress / elapsedDays) * 100) / 100;

  const remaining = 100 - progress;
  const daysToFinish = velocityPerDay > 0 ? Math.ceil(remaining / velocityPerDay) : Infinity;
  const estimatedCompletion =
    progress >= 100
      ? now.toISOString().slice(0, 10)
      : Number.isFinite(daysToFinish)
        ? new Date(now.getTime() + daysToFinish * DAY_MS).toISOString().slice(0, 10)
        : null;

  let status: GoalForecast["status"] = "unknown";
  let projectedProgressAtTarget = progress;
  if (goal.targetDate) {
    const target = new Date(goal.targetDate).getTime();
    const totalDays = Math.max(1, Math.round((target - start) / DAY_MS));
    const expectedByNow = Math.min(100, (elapsedDays / totalDays) * 100);
    projectedProgressAtTarget = Math.min(100, Math.round(velocityPerDay * totalDays));
    const pace = expectedByNow > 0 ? progress / expectedByNow : progress > 0 ? 2 : 1;
    if (progress >= 100) status = "on_track";
    else if (pace >= AHEAD_PACE_RATIO) status = "ahead";
    else if (pace < BEHIND_PACE_RATIO) status = "behind";
    else status = "on_track";
  }

  return { velocityPerDay, estimatedCompletion, status, projectedProgressAtTarget };
}
