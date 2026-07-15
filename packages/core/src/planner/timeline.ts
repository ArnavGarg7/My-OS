import type { PlannerBlock } from "./types";

/**
 * Timeline helpers (Sprint 2.6). Pure block math — durations, overlaps, gaps and
 * ordering. The timeline is always kept sorted by start time.
 */
export function ms(iso: string): number {
  return new Date(iso).getTime();
}

export function blockMinutes(block: PlannerBlock): number {
  return Math.round((ms(block.endTime) - ms(block.startTime)) / 60_000);
}

/** Do two blocks overlap in time? Touching edges do not count. */
export function overlaps(a: PlannerBlock, b: PlannerBlock): boolean {
  return ms(a.startTime) < ms(b.endTime) && ms(b.startTime) < ms(a.endTime);
}

export function sortBlocks(blocks: PlannerBlock[]): PlannerBlock[] {
  return [...blocks].sort(
    (a, b) => ms(a.startTime) - ms(b.startTime) || a.title.localeCompare(b.title),
  );
}

/** Total scheduled minutes (excludes overflow — that runs past the day). */
export function scheduledMinutes(blocks: PlannerBlock[]): number {
  return blocks.filter((b) => b.type !== "overflow").reduce((sum, b) => sum + blockMinutes(b), 0);
}

/** Gaps between consecutive blocks within [windowStart, windowEnd]. */
export interface Gap {
  start: number; // epoch ms
  end: number;
  minutes: number;
}

export function findGaps(blocks: PlannerBlock[], windowStart: number, windowEnd: number): Gap[] {
  const sorted = sortBlocks(blocks.filter((b) => b.type !== "overflow"));
  const gaps: Gap[] = [];
  let cursor = windowStart;
  for (const block of sorted) {
    const start = ms(block.startTime);
    if (start > cursor)
      gaps.push({ start: cursor, end: start, minutes: Math.round((start - cursor) / 60_000) });
    cursor = Math.max(cursor, ms(block.endTime));
  }
  if (cursor < windowEnd) {
    gaps.push({
      start: cursor,
      end: windowEnd,
      minutes: Math.round((windowEnd - cursor) / 60_000),
    });
  }
  return gaps;
}

/** True if [start, start+durationMs] is free of every busy block. */
export function isFree(start: number, durationMs: number, busy: PlannerBlock[]): boolean {
  const end = start + durationMs;
  return !busy.some((b) => start < ms(b.endTime) && ms(b.startTime) < end);
}

/** Earliest start >= cursor where a block of durationMs fits around busy blocks. */
export function earliestSlot(cursor: number, durationMs: number, busy: PlannerBlock[]): number {
  const sorted = [...busy].sort((a, b) => ms(a.startTime) - ms(b.startTime));
  let s = cursor;
  // Advance past any overlapping busy block; repeat until a clear window is found.
  let moved = true;
  while (moved) {
    moved = false;
    for (const b of sorted) {
      if (s < ms(b.endTime) && ms(b.startTime) < s + durationMs) {
        s = ms(b.endTime);
        moved = true;
      }
    }
  }
  return s;
}
