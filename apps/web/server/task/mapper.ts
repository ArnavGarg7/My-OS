import "server-only";
import type { Task, TaskLabel } from "@myos/core/task";
import type { TaskLabelColor } from "@myos/core/task";
import type { TaskLabelRow, TaskRow } from "@myos/db/schema";

/**
 * Task row ↔ DTO mapping (Sprint 2.5). Timestamps become ISO strings for the
 * pure engine + client. Relations (labels, dependencies) are hydrated in.
 */
export function labelRowToLabel(row: TaskLabelRow): TaskLabel {
  return { id: row.id, name: row.name, color: row.color as TaskLabelColor };
}

export function rowToTask(
  row: TaskRow,
  labels: TaskLabel[] = [],
  dependencies: string[] = [],
): Task {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    status: row.status,
    priority: row.priority,
    estimatedMinutes: row.estimatedMinutes,
    actualMinutes: row.actualMinutes,
    dueAt: row.dueAt ? row.dueAt.toISOString() : null,
    scheduledStart: row.scheduledStart ? row.scheduledStart.toISOString() : null,
    scheduledEnd: row.scheduledEnd ? row.scheduledEnd.toISOString() : null,
    completedAt: row.completedAt ? row.completedAt.toISOString() : null,
    parentTaskId: row.parentTaskId,
    projectId: row.projectId,
    milestoneId: row.milestoneId,
    objectiveId: row.objectiveId,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    labels,
    dependencies,
  };
}

/** The mutable columns for a task (used by insert + update). */
export function taskToColumns(task: Task) {
  return {
    title: task.title,
    description: task.description,
    status: task.status,
    priority: task.priority,
    estimatedMinutes: task.estimatedMinutes,
    actualMinutes: task.actualMinutes,
    dueAt: task.dueAt ? new Date(task.dueAt) : null,
    scheduledStart: task.scheduledStart ? new Date(task.scheduledStart) : null,
    scheduledEnd: task.scheduledEnd ? new Date(task.scheduledEnd) : null,
    completedAt: task.completedAt ? new Date(task.completedAt) : null,
    parentTaskId: task.parentTaskId,
    projectId: task.projectId,
    milestoneId: task.milestoneId,
    objectiveId: task.objectiveId,
    updatedAt: new Date(task.updatedAt),
  };
}
