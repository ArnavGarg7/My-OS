import { WORKING_DAY_MINUTES } from "./constants";
import type {
  CalendarMerge,
  CalendarMergeEvent,
  PlannerPreview,
  PlannerPreviewBlock,
} from "./types";

/**
 * Calendar merge + planner preview helpers (Sprint 3.1). The Calendar is
 * read-only and the Planner engine remains canonical — this module only merges
 * tomorrow's events into a read model and summarises a previewed plan. It never
 * edits events or overwrites the plan. Deterministic.
 */
const MS = 60_000;

function minutesBetween(startISO: string, endISO: string): number {
  return Math.max(0, Math.round((new Date(endISO).getTime() - new Date(startISO).getTime()) / MS));
}

export function mergeCalendar(events: CalendarMergeEvent[]): CalendarMerge {
  const sorted = events
    .slice()
    .sort((a, b) => (a.start < b.start ? -1 : a.start > b.start ? 1 : 0));
  const meetings = sorted.filter((e) => e.kind === "meeting" || e.kind === "class");
  const meetingMinutes = meetings.reduce((acc, e) => acc + minutesBetween(e.start, e.end), 0);

  // Free windows between consecutive events.
  const freeWindows: CalendarMerge["freeWindows"] = [];
  for (let i = 0; i < sorted.length - 1; i++) {
    const gap = minutesBetween(sorted[i]!.end, sorted[i + 1]!.start);
    if (gap >= 30) {
      freeWindows.push({ start: sorted[i]!.end, end: sorted[i + 1]!.start, minutes: gap });
    }
  }

  return {
    events: sorted,
    meetingMinutes,
    meetingCount: meetings.length,
    firstEventAt: sorted[0]?.start ?? null,
    lastEventEndsAt: sorted[sorted.length - 1]?.end ?? null,
    freeWindows,
    meetingHeavy: meetingMinutes >= 180,
  };
}

/** Summarise a previewed plan (blocks come from the real Planner engine). */
export function summarizePreview(
  targetDate: string,
  blocks: PlannerPreviewBlock[],
  status: PlannerPreview["status"] = "draft",
): PlannerPreview {
  const totalMinutes = blocks.reduce((acc, b) => acc + b.minutes, 0);
  return {
    targetDate,
    blocks: blocks.slice().sort((a, b) => (a.start < b.start ? -1 : a.start > b.start ? 1 : 0)),
    totalMinutes,
    blockCount: blocks.length,
    utilization: Math.max(0, Math.min(100, Math.round((totalMinutes / WORKING_DAY_MINUTES) * 100))),
    status,
  };
}
