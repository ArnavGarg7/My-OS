import { ms } from "./timezone";
import type { FreeBusy, Interval } from "./types";

/**
 * Calendar scheduler (Sprint 2.7). Deterministic slot-finding over free/busy
 * intervals — the Planner uses this to weave tasks around meetings. It only
 * proposes; it never commits.
 */
const FREE = new Set(["available", "focus"]);

/** Find the earliest free interval that fits `minutes`, on or after `now`. */
export function findSlot(
  intervals: Interval[],
  minutes: number,
  now: Date,
): { start: string; end: string } | null {
  const needMs = minutes * 60_000;
  const t = now.getTime();
  for (const i of intervals) {
    if (!FREE.has(i.type)) continue;
    const start = Math.max(ms(i.start), t);
    if (ms(i.end) - start >= needMs) {
      return { start: new Date(start).toISOString(), end: new Date(start + needMs).toISOString() };
    }
  }
  return null;
}

/** All free intervals of at least `minutes`, as busy/free-derived slots. */
export function freeSlots(intervals: Interval[], minMinutes = 0): Interval[] {
  return intervals.filter(
    (i) => FREE.has(i.type) && ms(i.end) - ms(i.start) >= minMinutes * 60_000,
  );
}

/** Meeting/busy intervals exported as fixed blocks the Planner must avoid. */
export function busyIntervals(intervals: Interval[]): Interval[] {
  return intervals.filter((i) => i.type === "meeting" || i.type === "busy" || i.type === "break");
}

/** A one-line free/busy headline for the Morning Briefing. */
export function freeBusyHeadline(fb: FreeBusy): string {
  if (fb.longestFreeSlot) {
    const start = new Date(fb.longestFreeSlot.start).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    const end = new Date(fb.longestFreeSlot.end).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    const hours = Math.round((fb.longestFreeSlot.minutes / 60) * 10) / 10;
    return `You have a free ${hours}h focus window from ${start}–${end}.`;
  }
  return `${fb.freePercent}% of your day is free.`;
}
