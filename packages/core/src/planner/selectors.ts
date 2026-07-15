import { blockMinutes, ms, scheduledMinutes, sortBlocks } from "./timeline";
import type { PlannerBlock, PlannerDay, Utilization } from "./types";

/**
 * Planner selectors (Sprint 2.6). Pure read helpers over a timeline — current
 * block, upcoming work, remaining minutes, utilization and free time.
 */
function hhmmToMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map((n) => parseInt(n, 10));
  return (h ?? 0) * 60 + (m ?? 0);
}

const WORK_TYPES = new Set(["task", "focus", "overflow", "meeting"]);

/** The block happening right now (prefers real work over breaks/buffers). */
export function currentBlock(blocks: PlannerBlock[], now: Date): PlannerBlock | null {
  const t = now.getTime();
  const active = blocks.filter((b) => ms(b.startTime) <= t && t < ms(b.endTime));
  if (active.length === 0) return null;
  return active.find((b) => WORK_TYPES.has(b.type)) ?? active[0]!;
}

/** The next block that starts after now. */
export function upcomingBlock(blocks: PlannerBlock[], now: Date): PlannerBlock | null {
  const t = now.getTime();
  return sortBlocks(blocks).find((b) => ms(b.startTime) > t) ?? null;
}

/** The next task-backed block after now. */
export function nextTaskBlock(blocks: PlannerBlock[], now: Date): PlannerBlock | null {
  const t = now.getTime();
  return sortBlocks(blocks).find((b) => b.taskId && ms(b.startTime) > t) ?? null;
}

/** Minutes of not-yet-finished work remaining from now. */
export function remainingWork(blocks: PlannerBlock[], now: Date): number {
  const t = now.getTime();
  return blocks
    .filter((b) => b.taskId && !b.completed && ms(b.endTime) > t)
    .reduce((sum, b) => sum + blockMinutes(b), 0);
}

export function utilization(day: PlannerDay, blocks: PlannerBlock[]): Utilization {
  const workingMinutes = Math.max(
    0,
    hhmmToMinutes(day.workingEnd) - hhmmToMinutes(day.workingStart),
  );
  const scheduled = scheduledMinutes(blocks);
  const freeMinutes = Math.max(0, workingMinutes - scheduled);
  const percentUtilized =
    workingMinutes > 0 ? Math.min(100, Math.round((scheduled / workingMinutes) * 100)) : 0;
  return { scheduledMinutes: scheduled, workingMinutes, freeMinutes, percentUtilized };
}

export function taskBlocks(blocks: PlannerBlock[]): PlannerBlock[] {
  return sortBlocks(blocks.filter((b) => b.taskId !== null));
}
