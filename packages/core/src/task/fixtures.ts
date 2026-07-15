import { taskEngine } from "./engine";
import type { Task, TaskDependency, TaskLabel } from "./types";

/** Test fixtures for the task engine (imported by *.test.ts). */
export const WH = { start: "09:00", end: "18:00" } as const;
export const at = (h: number, m = 0) => new Date(2026, 6, 7, h, m, 0);

export function makeTask(over: Partial<Task> = {}, now: Date = at(9)): Task {
  const base = taskEngine.create({ title: over.title ?? "A task" }, now);
  return {
    ...base,
    ...over,
    id: over.id ?? "t1",
    labels: over.labels ?? [],
    dependencies: over.dependencies ?? [],
  };
}

export function makeLabel(over: Partial<TaskLabel> = {}): TaskLabel {
  return { id: over.id ?? "l1", name: over.name ?? "Work", color: over.color ?? "blue" };
}

export function dep(taskId: string, dependsOnTaskId: string): TaskDependency {
  return { taskId, dependsOnTaskId };
}
