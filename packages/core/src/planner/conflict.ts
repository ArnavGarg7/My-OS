import type { Task, TaskDependency } from "../task";
import { ms, overlaps } from "./timeline";
import type { Conflict, PlannerBlock } from "./types";

/**
 * Conflict engine (Sprint 2.6). Deterministically detects problems in a timeline
 * — overlaps, impossible schedules, dependency violations, overdue work and
 * insufficient hours. Nothing is auto-resolved; the list is returned as-is.
 */
export function detectConflicts(input: {
  blocks: PlannerBlock[];
  tasks: Task[];
  dependencies: TaskDependency[];
  workingStart: Date;
  workingEnd: Date;
  now: Date;
}): Conflict[] {
  const { blocks, tasks, dependencies, workingStart, workingEnd, now } = input;
  const conflicts: Conflict[] = [];
  const byTask = new Map(tasks.map((t) => [t.id, t]));
  const blockByTask = new Map(blocks.filter((b) => b.taskId).map((b) => [b.taskId!, b]));

  // Overlaps (ignore overflow which intentionally runs past the day).
  const timed = blocks.filter((b) => b.type !== "overflow");
  for (let i = 0; i < timed.length; i++) {
    for (let j = i + 1; j < timed.length; j++) {
      if (overlaps(timed[i]!, timed[j]!)) {
        conflicts.push({
          type: "overlap",
          message: `"${timed[i]!.title}" overlaps "${timed[j]!.title}".`,
          blockIds: [timed[i]!.id, timed[j]!.id],
          taskIds: [timed[i]!.taskId, timed[j]!.taskId].filter((x): x is string => !!x),
        });
      }
    }
  }

  const workingMinutes = Math.round((workingEnd.getTime() - workingStart.getTime()) / 60_000);

  // Impossible: a single task longer than the entire working window.
  for (const task of tasks) {
    if ((task.estimatedMinutes ?? 0) > workingMinutes) {
      conflicts.push({
        type: "impossible",
        message: `"${task.title}" needs more time than a full working day.`,
        blockIds: [blockByTask.get(task.id)?.id ?? ""].filter(Boolean),
        taskIds: [task.id],
      });
    }
  }

  // Dependency violations: a dependent scheduled before its dependency ends.
  for (const { taskId, dependsOnTaskId } of dependencies) {
    const a = blockByTask.get(taskId);
    const b = blockByTask.get(dependsOnTaskId);
    if (a && b && ms(a.startTime) < ms(b.endTime)) {
      conflicts.push({
        type: "dependency-violation",
        message: `"${byTask.get(taskId)?.title ?? taskId}" is scheduled before "${byTask.get(dependsOnTaskId)?.title ?? dependsOnTaskId}" finishes.`,
        blockIds: [a.id, b.id],
        taskIds: [taskId, dependsOnTaskId],
      });
    }
  }

  // Overdue: a task scheduled to finish after its due date.
  for (const block of blocks) {
    if (!block.taskId) continue;
    const task = byTask.get(block.taskId);
    if (task?.dueAt && ms(block.endTime) > new Date(task.dueAt).getTime()) {
      conflicts.push({
        type: "overdue",
        message: `"${task.title}" is scheduled past its due date.`,
        blockIds: [block.id],
        taskIds: [task.id],
      });
    }
  }

  // Insufficient hours: total task time exceeds the time left in the window.
  const remaining = Math.max(
    0,
    Math.round((workingEnd.getTime() - Math.max(now.getTime(), workingStart.getTime())) / 60_000),
  );
  const totalTaskMinutes = tasks.reduce((sum, t) => sum + (t.estimatedMinutes ?? 0), 0);
  if (totalTaskMinutes > remaining) {
    conflicts.push({
      type: "insufficient-hours",
      message: `Planned work (${totalTaskMinutes} min) exceeds the ${remaining} min left today.`,
      blockIds: [],
      taskIds: tasks.map((t) => t.id),
    });
  }

  return conflicts;
}
