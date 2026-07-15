import { HEAVY_MEETING_MINUTES, LOW_READINESS, OVERLOADED_CARRY_FORWARD } from "./constants";
import type { CarryForwardList, TomorrowReadiness, TomorrowSignals } from "./types";

/**
 * Tomorrow decision signals (Sprint 3.1). Deterministic booleans the Decision
 * engine consumes to nudge tomorrow's plan: too much unfinished work, a heavy
 * meeting day, or low readiness. Rule-based — no AI.
 */
export function tomorrowSignals(
  carryForward: CarryForwardList,
  readiness: TomorrowReadiness,
  priorityCount: number,
): TomorrowSignals {
  return {
    tooMuchUnfinished: carryForward.total > OVERLOADED_CARRY_FORWARD,
    heavyMeetingDay: readiness.meetingMinutes >= HEAVY_MEETING_MINUTES,
    lowReadiness: readiness.score <= LOW_READINESS,
    carryForwardCount: carryForward.total,
    priorityCount,
  };
}
