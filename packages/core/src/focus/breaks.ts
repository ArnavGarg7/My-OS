import {
  HIGH_INTERRUPTION_COUNT,
  LONG_WORK_MINUTES,
  LOW_READINESS_SCORE,
  RECOVERY_BREAK_MINUTES,
  SHORT_BREAK_MINUTES,
  STANDARD_WORK_MINUTES,
  type BreakType,
} from "./constants";
import { focusMinutesAt } from "./timer";
import type { BreakRecommendation, FocusBreak, FocusSession } from "./types";

/**
 * Deterministic break rules (Sprint 3.2). No timers, no AI — a fixed rule ladder
 * over the current focus minutes, interruption count and (optional) Health
 * readiness. Rules (first match wins):
 *   • ≥90 min continuous focus → 20 min recovery break
 *   • ≥50 min focus            → 10 min short break
 *   • ≥4 interruptions         → reset with a short break
 *   • readiness <55            → longer (recovery) break
 */
export function recommendBreak(
  session: FocusSession,
  now: Date,
  readinessScore?: number | null,
): BreakRecommendation {
  const minutes = focusMinutesAt(session, now);
  const interruptions = session.interruptions.length;

  if (minutes >= LONG_WORK_MINUTES) {
    return {
      recommend: true,
      type: "recovery",
      minutes: RECOVERY_BREAK_MINUTES,
      reason: `You've focused for ${minutes} min straight — take a ${RECOVERY_BREAK_MINUTES} min recovery break.`,
    };
  }

  if (typeof readinessScore === "number" && readinessScore < LOW_READINESS_SCORE) {
    return {
      recommend: true,
      type: "recovery",
      minutes: RECOVERY_BREAK_MINUTES,
      reason: `Readiness is low (${Math.round(readinessScore)}) — a longer ${RECOVERY_BREAK_MINUTES} min break will help.`,
    };
  }

  if (interruptions >= HIGH_INTERRUPTION_COUNT) {
    return {
      recommend: true,
      type: "short",
      minutes: SHORT_BREAK_MINUTES,
      reason: `${interruptions} interruptions — reset with a ${SHORT_BREAK_MINUTES} min break.`,
    };
  }

  if (minutes >= STANDARD_WORK_MINUTES) {
    return {
      recommend: true,
      type: "short",
      minutes: SHORT_BREAK_MINUTES,
      reason: `${minutes} min of focus — a ${SHORT_BREAK_MINUTES} min break keeps you sharp.`,
    };
  }

  return {
    recommend: false,
    type: "short",
    minutes: SHORT_BREAK_MINUTES,
    reason: "Keep going — no break needed yet.",
  };
}

/** Build a break record from a recommendation (or explicit type/minutes). */
export function makeBreak(
  id: string,
  now: Date,
  type: BreakType,
  plannedMinutes: number,
): FocusBreak {
  return {
    id,
    type,
    startedAt: now.toISOString(),
    endedAt: null,
    plannedMinutes: Math.max(1, plannedMinutes),
  };
}

/** Total completed break minutes for a session. */
export function breakMinutes(session: FocusSession): number {
  return session.breaks.reduce((sum, b) => {
    if (!b.endedAt) return sum;
    const start = Date.parse(b.startedAt);
    const end = Date.parse(b.endedAt);
    if (Number.isNaN(start) || Number.isNaN(end)) return sum;
    return sum + Math.max(0, Math.floor((end - start) / 60_000));
  }, 0);
}

/** Break minutes that count as recovery (recovery/hydration/walk). */
export function recoveredMinutes(session: FocusSession): number {
  const recovery: readonly BreakType[] = ["recovery", "hydration", "walk"];
  return session.breaks.reduce((sum, b) => {
    if (!b.endedAt || !recovery.includes(b.type)) return sum;
    const start = Date.parse(b.startedAt);
    const end = Date.parse(b.endedAt);
    if (Number.isNaN(start) || Number.isNaN(end)) return sum;
    return sum + Math.max(0, Math.floor((end - start) / 60_000));
  }, 0);
}
