import type { Task } from "../task";
import { BUFFER_RATIO, CONFIDENCE } from "./constants";
import { tasksForProject } from "./hierarchy";
import type { Forecast, Project } from "./types";

/**
 * Forecast engine (Sprint 2.8). Rule-based, deterministic — velocity from
 * historical completion, remaining work, estimated completion, schedule
 * confidence and delay prediction. No AI, no ML.
 */
const DAY_MS = 86_400_000;

export function forecast(project: Project, tasks: Task[], now: Date): Forecast {
  const owned = tasksForProject(tasks, project.id);
  const completed = owned.filter((t) => t.status === "completed");
  const remaining = owned.filter((t) => t.status !== "completed" && t.status !== "archived").length;

  // Velocity: completed tasks per elapsed day since project start (min 1 day).
  const start = project.startDate
    ? new Date(project.startDate).getTime()
    : new Date(project.createdAt).getTime();
  const elapsedDays = Math.max(1, Math.round((now.getTime() - start) / DAY_MS));
  const velocityPerDay = completed.length / elapsedDays;

  const daysToFinish = velocityPerDay > 0 ? Math.ceil(remaining / velocityPerDay) : Infinity;
  const estimatedCompletion =
    remaining === 0
      ? now.toISOString().slice(0, 10)
      : Number.isFinite(daysToFinish)
        ? new Date(now.getTime() + daysToFinish * DAY_MS).toISOString().slice(0, 10)
        : null;

  // Schedule confidence + delay vs the target date.
  let onTrack = true;
  let predictedDelayDays = 0;
  let confidence = remaining === 0 ? 100 : velocityPerDay > 0 ? CONFIDENCE.high : CONFIDENCE.medium;
  if (project.targetDate && estimatedCompletion) {
    const target = new Date(project.targetDate).getTime();
    const est = new Date(estimatedCompletion).getTime();
    if (est > target) {
      onTrack = false;
      predictedDelayDays = Math.ceil((est - target) / DAY_MS);
      confidence = Math.max(20, confidence - Math.min(60, predictedDelayDays * 3));
    }
  } else if (!Number.isFinite(daysToFinish) && remaining > 0) {
    onTrack = false;
    confidence = 20;
  }

  return {
    velocityPerDay: Math.round(velocityPerDay * 100) / 100,
    remainingTasks: remaining,
    estimatedCompletion,
    confidence,
    onTrack,
    bufferDays: Math.ceil(predictedDelayDays * BUFFER_RATIO) + (onTrack ? 0 : 1),
    predictedDelayDays,
  };
}
