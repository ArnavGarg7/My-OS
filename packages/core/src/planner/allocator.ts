import type { Task } from "../task";
import { DEFAULT_TASK_MINUTES } from "./constants";
import { earliestSlot, ms } from "./timeline";
import type { PlannerBlock } from "./types";

/**
 * Allocation engine (Sprint 2.6). Places ordered tasks into the earliest free
 * slots, weaving around fixed blocks. Work that spills past the working window
 * becomes an `overflow` block — nothing silently disappears. Deterministic.
 */
export interface AllocationContext {
  date: string;
  now: Date;
  workingStart: Date;
  workingEnd: Date;
  fixedBlocks: PlannerBlock[];
  nowIso: string;
}

export function allocateTasks(order: Task[], ctx: AllocationContext): PlannerBlock[] {
  const busy: PlannerBlock[] = [...ctx.fixedBlocks];
  const result: PlannerBlock[] = [];
  let cursor = Math.max(ctx.now.getTime(), ctx.workingStart.getTime());
  const windowEnd = ctx.workingEnd.getTime();

  for (const task of order) {
    const minutes = task.estimatedMinutes ?? DEFAULT_TASK_MINUTES;
    const durationMs = minutes * 60_000;
    const start = earliestSlot(cursor, durationMs, busy);
    const end = start + durationMs;
    const overflow = start >= windowEnd || end > windowEnd;

    const block: PlannerBlock = {
      id: "",
      plannerDate: ctx.date,
      taskId: task.id,
      type: overflow ? "overflow" : "task",
      title: task.title,
      startTime: new Date(start).toISOString(),
      endTime: new Date(end).toISOString(),
      locked: false,
      generated: true,
      completed: false,
      source: "task",
      createdAt: ctx.nowIso,
    };
    result.push(block);
    busy.push(block);
    cursor = end;
  }

  return result.sort((a, b) => ms(a.startTime) - ms(b.startTime));
}
