import { taskEngine, type Task } from "../task";
import type { PlannerBlock, PlannerDay } from "./types";

/** Test fixtures for the planner (imported by *.test.ts). */
export const DATE = "2026-07-07";
export const WH = { start: "09:00", end: "18:00" } as const;

/** A Date at HH:MM on the fixture date (local time). */
export const at = (h: number, m = 0) => {
  const d = new Date(`${DATE}T00:00:00`);
  d.setHours(h, m, 0, 0);
  return d;
};

export function makeTask(over: Partial<Task> = {}): Task {
  const base = taskEngine.create({ title: over.title ?? "Task" }, at(9));
  return {
    ...base,
    ...over,
    id: over.id ?? "t1",
    estimatedMinutes: over.estimatedMinutes !== undefined ? over.estimatedMinutes : 60,
    labels: over.labels ?? [],
    dependencies: over.dependencies ?? [],
  };
}

export function makeBlockFixture(over: Partial<PlannerBlock> = {}): PlannerBlock {
  const start = over.startTime ?? at(9).toISOString();
  const end = over.endTime ?? at(10).toISOString();
  return {
    id: over.id ?? "b1",
    plannerDate: DATE,
    taskId: over.taskId ?? null,
    type: over.type ?? "task",
    title: over.title ?? "Block",
    startTime: start,
    endTime: end,
    locked: over.locked ?? false,
    generated: over.generated ?? true,
    completed: over.completed ?? false,
    source: over.source ?? "generated",
    createdAt: over.createdAt ?? start,
    ...over,
  };
}

export function makeDay(over: Partial<PlannerDay> = {}): PlannerDay {
  return {
    date: DATE,
    generatedAt: null,
    workingStart: "09:00",
    workingEnd: "18:00",
    focusWindowStart: null,
    focusWindowEnd: null,
    status: "empty",
    locked: false,
    ...over,
  };
}
