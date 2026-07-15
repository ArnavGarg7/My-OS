import type { WorkingHours } from "../today";
import { DEFAULT_ESTIMATE_MINUTES } from "./constants";
import type { ScheduleResult, Task } from "./types";

/**
 * Scheduling engine (Sprint 2.5). Deterministic — computes the earliest working
 * slot that fits a task's estimate given already-scheduled work. It only
 * *recommends*; nothing is committed (the Planner in 2.6 consumes this).
 */
interface Block {
  start: number; // epoch ms
  end: number;
}

function atTimeOnDay(day: Date, hhmm: string): Date {
  const [h, m] = hhmm.split(":").map((n) => parseInt(n, 10));
  const d = new Date(day.getTime());
  d.setHours(h ?? 0, m ?? 0, 0, 0);
  return d;
}

function toBlocks(existing: Task[]): Block[] {
  return existing
    .filter((t) => t.scheduledStart && t.scheduledEnd)
    .map((t) => ({
      start: new Date(t.scheduledStart!).getTime(),
      end: new Date(t.scheduledEnd!).getTime(),
    }))
    .sort((a, b) => a.start - b.start);
}

/**
 * Recommend a slot for `task`. Walks the working window from `now`, skipping
 * busy blocks, and returns the first gap large enough. If the task can't finish
 * before the window closes, it flags overflow + the minutes that spill over.
 */
export function scheduleTask(input: {
  task: Task;
  workingHours: WorkingHours;
  existing: Task[];
  now: Date;
}): ScheduleResult {
  const { task, workingHours, existing, now } = input;
  const estimate = task.estimatedMinutes ?? DEFAULT_ESTIMATE_MINUTES;
  const estimateMs = estimate * 60_000;

  const windowStart = atTimeOnDay(now, workingHours.start).getTime();
  const windowEnd = atTimeOnDay(now, workingHours.end).getTime();

  let cursor = Math.max(now.getTime(), windowStart);
  const blocks = toBlocks(existing).filter((b) => b.end > cursor && b.start < windowEnd);

  for (const block of blocks) {
    if (block.start - cursor >= estimateMs) break; // gap before this block fits
    cursor = Math.max(cursor, block.end);
  }

  if (cursor >= windowEnd) {
    return {
      recommendedStart: null,
      recommendedEnd: null,
      overflow: true,
      remainingWork: estimate,
    };
  }

  const end = cursor + estimateMs;
  const overflow = end > windowEnd;
  const remainingWork = overflow ? Math.round((end - windowEnd) / 60_000) : 0;

  return {
    recommendedStart: new Date(cursor).toISOString(),
    recommendedEnd: new Date(end).toISOString(),
    overflow,
    remainingWork,
  };
}
