import { OPEN_STATUSES, type TaskStatus } from "./constants";
import { comparePriority } from "./priority";
import type { Task, TaskFilter, TaskLabel, TaskSort } from "./types";

/**
 * Task selectors (Sprint 2.5). Pure read helpers over a task list. The UI and
 * server derive views from these instead of re-querying.
 */
export function selectByStatus(tasks: Task[], status: TaskStatus): Task[] {
  return tasks.filter((t) => t.status === status);
}

/** Open work — not completed, not archived. */
export function selectOpen(tasks: Task[]): Task[] {
  return tasks.filter((t) => OPEN_STATUSES.includes(t.status));
}

export function selectScheduled(tasks: Task[]): Task[] {
  return tasks.filter((t) => t.scheduledStart !== null && t.status !== "completed");
}

export function selectOverdue(tasks: Task[], now: Date): Task[] {
  const ts = now.getTime();
  return tasks.filter(
    (t) => t.dueAt !== null && new Date(t.dueAt).getTime() < ts && OPEN_STATUSES.includes(t.status),
  );
}

export interface TaskCounts {
  open: number;
  scheduled: number;
  overdue: number;
  completed: number;
}

export function taskCounts(tasks: Task[], now: Date): TaskCounts {
  return {
    open: selectOpen(tasks).length,
    scheduled: selectScheduled(tasks).length,
    overdue: selectOverdue(tasks, now).length,
    completed: selectByStatus(tasks, "completed").length,
  };
}

export function filterTasks(tasks: Task[], filter: TaskFilter): Task[] {
  return tasks.filter(
    (t) =>
      (!filter.status || t.status === filter.status) &&
      (!filter.priority || t.priority === filter.priority) &&
      (!filter.labelId || t.labels.some((l) => l.id === filter.labelId)),
  );
}

export function sortTasks(tasks: Task[], sort: TaskSort): Task[] {
  const copy = [...tasks];
  const dueAsc = (a: Task, b: Task) => {
    if (a.dueAt === b.dueAt) return 0;
    if (a.dueAt === null) return 1;
    if (b.dueAt === null) return -1;
    return new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime();
  };
  switch (sort) {
    case "priority":
      return copy.sort((a, b) => comparePriority(a.priority, b.priority) || dueAsc(a, b));
    case "due":
      return copy.sort(dueAsc);
    case "title":
      return copy.sort((a, b) => a.title.localeCompare(b.title));
    case "created":
    default:
      return copy.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
}

export function searchTasks(tasks: Task[], text: string): Task[] {
  const q = text.trim().toLowerCase();
  if (!q) return tasks;
  return tasks.filter(
    (t) => t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q),
  );
}

/** Distinct labels present across the task set (by id). */
export function selectLabels(tasks: Task[]): TaskLabel[] {
  const map = new Map<string, TaskLabel>();
  for (const t of tasks) for (const l of t.labels) map.set(l.id, l);
  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
}
