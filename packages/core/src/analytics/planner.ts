import { clampScore, countKind, pct } from "./metrics";
import type { CalendarMetrics, PlannerAnalyticsInput } from "./types";
import type { TimelineEvent } from "../timeline";

/**
 * Planner + calendar analytics (Sprint 2.14). Planner adherence comes from the
 * planner snapshot the server passes; calendar metrics derive from meeting
 * events + focus metadata in the Timeline. All deterministic.
 */
export interface PlannerMetrics {
  accuracy: number; // 0–100
  blocksCompleted: number;
  blocksTotal: number;
  completionRate: number; // 0–100
  regenerations: number;
  lockedBlocks: number;
  overflow: number;
  utilization: number; // 0–100
}

export function computePlanner(input?: PlannerAnalyticsInput): PlannerMetrics {
  const p = input ?? {
    accuracy: 0,
    blocksCompleted: 0,
    blocksTotal: 0,
    regenerations: 0,
    lockedBlocks: 0,
    overflow: 0,
    utilization: 0,
  };
  return {
    accuracy: clampScore(p.accuracy),
    blocksCompleted: p.blocksCompleted,
    blocksTotal: p.blocksTotal,
    completionRate: pct(p.blocksCompleted, p.blocksTotal),
    regenerations: p.regenerations,
    lockedBlocks: p.lockedBlocks,
    overflow: p.overflow,
    utilization: clampScore(p.utilization),
  };
}

const MEETING_MINUTES_DEFAULT = 30;

/** Calendar metrics from meeting-finished events + focus metadata. */
export function computeCalendar(events: TimelineEvent[], focusMinutes: number): CalendarMetrics {
  const meetings = events.filter((e) => e.eventType === "calendar.meeting_finished");
  const meetingMinutes = meetings.reduce((acc, e) => {
    const m = e.metadata["durationMinutes"];
    return acc + (typeof m === "number" ? m : MEETING_MINUTES_DEFAULT);
  }, 0);
  const meetingHours = Math.round((meetingMinutes / 60) * 10) / 10;
  const focusHours = Math.round((focusMinutes / 60) * 10) / 10;
  // Assume an 8h working day per active day for utilization/free math.
  const activeDays = new Set(events.map((e) => e.timestamp.slice(0, 10))).size || 1;
  const availableHours = activeDays * 8;
  const usedHours = meetingHours + focusHours;
  const freeHours = Math.max(0, Math.round((availableHours - usedHours) * 10) / 10);
  const longest = events
    .map((e) => (typeof e.metadata["focusMinutes"] === "number" ? e.metadata["focusMinutes"] : 0))
    .reduce((max, m) => Math.max(max, m), 0);

  return {
    meetingHours,
    focusHours,
    freeHours,
    meetingRatio: pct(meetingHours, usedHours),
    utilization: pct(usedHours, availableHours),
    longestUninterruptedMinutes: longest,
  };
}

/** Count planner regeneration events (used by planner-accuracy decision rule). */
export function plannerRegenerations(events: TimelineEvent[]): number {
  return countKind(events, "planner.regenerated");
}
