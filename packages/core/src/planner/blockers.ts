import { LUNCH_MINUTES, LUNCH_TIME } from "./constants";
import type { PlannerBlock } from "./types";

/**
 * Fixed / non-task blocks (Sprint 2.6). Deterministic helpers that seed the day
 * with breaks and buffers the allocator must schedule around.
 */
function atTime(date: string, hhmm: string): Date {
  const [h, m] = hhmm.split(":").map((n) => parseInt(n, 10));
  const d = new Date(`${date}T00:00:00`);
  d.setHours(h ?? 0, m ?? 0, 0, 0);
  return d;
}

export function makeBlock(
  date: string,
  type: PlannerBlock["type"],
  title: string,
  start: Date,
  end: Date,
  over: Partial<PlannerBlock> = {},
): PlannerBlock {
  return {
    id: "",
    plannerDate: date,
    taskId: null,
    type,
    title,
    startTime: start.toISOString(),
    endTime: end.toISOString(),
    locked: false,
    generated: true,
    completed: false,
    source: "generated",
    createdAt: start.toISOString(),
    ...over,
  };
}

/** A standard midday lunch break (only if it falls within the working window). */
export function lunchBreak(
  date: string,
  workingStart: string,
  workingEnd: string,
): PlannerBlock | null {
  const start = atTime(date, LUNCH_TIME);
  const end = new Date(start.getTime() + LUNCH_MINUTES * 60_000);
  if (start.getTime() < atTime(date, workingStart).getTime()) return null;
  if (end.getTime() > atTime(date, workingEnd).getTime()) return null;
  return makeBlock(date, "break", "Lunch", start, end);
}

/** A buffer block of the given length starting at `start`. */
export function bufferBlock(date: string, start: Date, minutes: number): PlannerBlock {
  return makeBlock(date, "buffer", "Buffer", start, new Date(start.getTime() + minutes * 60_000));
}

export function timeToDate(date: string, hhmm: string): Date {
  return atTime(date, hhmm);
}
