import { DEEP_WORK_TYPES, WORK_TYPES } from "./constants";
import { breakMinutes, recoveredMinutes } from "./breaks";
import { focusMinutesAt } from "./timer";
import type { FocusMetrics, FocusSession } from "./types";

/**
 * Derived focus metrics (Sprint 3.2). ALWAYS computed from sessions, NEVER stored.
 * The daily-summary table caches these for history, but the numbers themselves are
 * always reproducible from the underlying sessions here. Pure — pass `now` for the
 * effective-focus calculation of any still-running session.
 */
function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

function sessionFocusMinutes(session: FocusSession, now: Date): number {
  return focusMinutesAt(session, now);
}

export function computeMetrics(sessions: FocusSession[], now: Date): FocusMetrics {
  const empty: FocusMetrics = {
    focusPercent: 0,
    deepWorkMinutes: 0,
    shallowMinutes: 0,
    breakMinutes: 0,
    interruptions: 0,
    longestSessionMinutes: 0,
    averageSessionMinutes: 0,
    completionRate: 0,
    plannerAccuracy: 0,
    recoveredMinutes: 0,
    totalSessions: 0,
    completedSessions: 0,
  };
  if (sessions.length === 0) return empty;

  let deepWorkMinutes = 0;
  let shallowMinutes = 0;
  let breakMin = 0;
  let recoveredMin = 0;
  let interruptions = 0;
  let longest = 0;
  let workMinutesTotal = 0;
  let workSessions = 0;
  let completedSessions = 0;
  let plannerLinked = 0;
  let plannerCompleted = 0;

  for (const s of sessions) {
    const focus = sessionFocusMinutes(s, now);
    interruptions += s.interruptions.length;
    breakMin += breakMinutes(s);
    recoveredMin += recoveredMinutes(s);

    if (WORK_TYPES.includes(s.type)) {
      workSessions += 1;
      workMinutesTotal += focus;
      longest = Math.max(longest, focus);
      if (DEEP_WORK_TYPES.includes(s.type)) deepWorkMinutes += focus;
      else shallowMinutes += focus;
    }

    if (s.completed) completedSessions += 1;
    if (s.plannerBlockId) {
      plannerLinked += 1;
      if (s.completed) plannerCompleted += 1;
    }
  }

  const workSpan = deepWorkMinutes + shallowMinutes + breakMin;
  const focusPercent =
    workSpan === 0 ? 0 : round1(((deepWorkMinutes + shallowMinutes) / workSpan) * 100);
  const averageSessionMinutes = workSessions === 0 ? 0 : round1(workMinutesTotal / workSessions);
  const completionRate = round1((completedSessions / sessions.length) * 100);
  const plannerAccuracy =
    plannerLinked === 0 ? 0 : round1((plannerCompleted / plannerLinked) * 100);

  return {
    focusPercent,
    deepWorkMinutes,
    shallowMinutes,
    breakMinutes: breakMin,
    interruptions,
    longestSessionMinutes: longest,
    averageSessionMinutes,
    completionRate,
    plannerAccuracy,
    recoveredMinutes: recoveredMin,
    totalSessions: sessions.length,
    completedSessions,
  };
}

/** Total effective focus minutes across sessions. */
export function totalFocusMinutes(sessions: FocusSession[], now: Date): number {
  return sessions.reduce(
    (sum, s) => (WORK_TYPES.includes(s.type) ? sum + focusMinutesAt(s, now) : sum),
    0,
  );
}

/** Total deep-work minutes across sessions. */
export function totalDeepWorkMinutes(sessions: FocusSession[], now: Date): number {
  return sessions.reduce(
    (sum, s) => (DEEP_WORK_TYPES.includes(s.type) ? sum + focusMinutesAt(s, now) : sum),
    0,
  );
}
