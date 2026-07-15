import { computeMetrics, totalDeepWorkMinutes, totalFocusMinutes } from "./metrics";
import { computeTimer } from "./timer";
import type { FocusSession, FocusSummary } from "./types";

/**
 * Compact focus summary (Sprint 3.2) for the status bar, context panel, Morning and
 * Tomorrow surfaces. Pure — derived from the active session + the day's sessions.
 */
export function buildSummary(
  active: FocusSession | null,
  todaysSessions: FocusSession[],
  now: Date,
): FocusSummary {
  const remainingMinutes =
    active && active.status !== "idle"
      ? Math.ceil(computeTimer(active, now).remainingMs / 60_000)
      : 0;

  const completedToday = todaysSessions.filter((s) => s.completed).length;
  const interruptionsToday = todaysSessions.reduce((n, s) => n + s.interruptions.length, 0);

  return {
    active: active !== null && active.status !== "idle",
    status: active?.status ?? "idle",
    sessionType: active?.type ?? null,
    remainingMinutes: Math.max(0, remainingMinutes),
    focusMinutesToday: totalFocusMinutes(todaysSessions, now),
    deepWorkMinutesToday: totalDeepWorkMinutes(todaysSessions, now),
    completedToday,
    interruptionsToday,
  };
}

/** Daily-summary snapshot (persisted for history; still derived from sessions). */
export interface DailySummarySnapshot {
  date: string;
  focusMinutes: number;
  deepWorkMinutes: number;
  shallowMinutes: number;
  breakMinutes: number;
  interruptions: number;
  sessions: number;
  completedSessions: number;
  longestSessionMinutes: number;
  completionRate: number;
  plannerAccuracy: number;
}

export function buildDailySnapshot(
  date: string,
  sessions: FocusSession[],
  now: Date,
): DailySummarySnapshot {
  const m = computeMetrics(sessions, now);
  return {
    date,
    focusMinutes: m.deepWorkMinutes + m.shallowMinutes,
    deepWorkMinutes: m.deepWorkMinutes,
    shallowMinutes: m.shallowMinutes,
    breakMinutes: m.breakMinutes,
    interruptions: m.interruptions,
    sessions: m.totalSessions,
    completedSessions: m.completedSessions,
    longestSessionMinutes: m.longestSessionMinutes,
    completionRate: m.completionRate,
    plannerAccuracy: m.plannerAccuracy,
  };
}
