import { blockingDependencies } from "./dependency";
import type { Task, TaskDependency, TaskProgress } from "./types";

/**
 * Progress engine (Sprint 2.5). Derives a task's progress from its stored fields
 * — completion %, remaining minutes, lateness and blocked state — without
 * storing redundant values. Deterministic.
 */
export function calculateProgress(
  task: Task,
  deps: TaskDependency[],
  allTasks: Task[],
  now: Date,
): TaskProgress {
  const blockedBy = blockingDependencies(task.id, deps, allTasks);
  const isBlocked = task.status === "blocked" || blockedBy.length > 0;

  let completionPercent = 0;
  if (task.status === "completed") {
    completionPercent = 100;
  } else if (task.estimatedMinutes && task.actualMinutes) {
    completionPercent = Math.min(
      99,
      Math.round((task.actualMinutes / task.estimatedMinutes) * 100),
    );
  } else if (task.status === "in_progress") {
    completionPercent = 10;
  }

  const remainingMinutes =
    task.status === "completed"
      ? 0
      : task.estimatedMinutes === null
        ? null
        : Math.max(0, task.estimatedMinutes - (task.actualMinutes ?? 0));

  const isLate =
    task.status !== "completed" &&
    task.dueAt !== null &&
    now.getTime() > new Date(task.dueAt).getTime();

  return {
    status: task.status,
    completionPercent,
    remainingMinutes,
    isLate,
    isBlocked,
    blockedBy,
  };
}
