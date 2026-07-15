import { DEEP_WORK_MINUTES } from "./constants";
import { ms } from "./timezone";
import type { FreeBusy, Interval } from "./types";

/**
 * Free/Busy engine (Sprint 2.7). Reduces classified intervals into headline
 * metrics — busy/free split, meeting/focus/personal hours, the longest free slot
 * and the next free window. Consumed by the Planner, Today and Morning Briefing.
 */
const FREE_TYPES = new Set(["available", "focus"]);
const BUSY_TYPES = new Set(["meeting", "busy", "break"]);

function minutes(interval: Interval): number {
  return Math.round((ms(interval.end) - ms(interval.start)) / 60_000);
}

export function computeFreeBusy(intervals: Interval[], now?: Date): FreeBusy {
  let busy = 0;
  let free = 0;
  let meeting = 0;
  let focus = 0;
  let personal = 0;

  for (const interval of intervals) {
    const m = minutes(interval);
    if (interval.type === "meeting") meeting += m;
    if (interval.type === "focus") focus += m;
    if (interval.type === "personal") personal += m;
    if (BUSY_TYPES.has(interval.type)) busy += m;
    else if (FREE_TYPES.has(interval.type)) free += m;
  }

  const total = busy + free;
  const freeIntervals = intervals.filter((i) => FREE_TYPES.has(i.type));

  // Longest free slot overall.
  let longest: FreeBusy["longestFreeSlot"] = null;
  for (const i of freeIntervals) {
    const m = minutes(i);
    if (!longest || m > longest.minutes) longest = { start: i.start, end: i.end, minutes: m };
  }

  // Next free window from `now`.
  let next: FreeBusy["nextFreeWindow"] = null;
  if (now) {
    const t = now.getTime();
    for (const i of freeIntervals) {
      if (ms(i.end) > t) {
        const start = Math.max(ms(i.start), t);
        next = {
          start: new Date(start).toISOString(),
          end: i.end,
          minutes: Math.round((ms(i.end) - start) / 60_000),
        };
        break;
      }
    }
  }

  return {
    busyMinutes: busy,
    freeMinutes: free,
    meetingMinutes: meeting,
    focusMinutes: focus,
    personalMinutes: personal,
    busyPercent: total > 0 ? Math.round((busy / total) * 100) : 0,
    freePercent: total > 0 ? Math.round((free / total) * 100) : 0,
    longestFreeSlot: longest,
    nextFreeWindow: next,
  };
}

/** Does the day contain at least one deep-work-sized free slot? */
export function hasDeepWorkWindow(intervals: Interval[]): boolean {
  return intervals.some((i) => FREE_TYPES.has(i.type) && minutes(i) >= DEEP_WORK_MINUTES);
}
