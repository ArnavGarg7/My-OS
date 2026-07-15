import { HIGH_INTERRUPTION_COUNT, WORK_TYPES } from "./constants";
import { isOverrunning, focusMinutesAt } from "./timer";
import { totalFocusMinutes } from "./metrics";
import type { FocusSession, FocusSignals } from "./types";

/**
 * Deterministic focus signals for the Decision engine (Sprint 3.2). Pure booleans +
 * counts derived from the active session and the day's sessions. The Decision engine
 * turns these into recommendations via its own rules — Focus never emits decisions.
 *
 *   • tooManyInterruptions → suggest a break
 *   • longUnfinished       → suggest stopping / finishing
 *   • plannerDrift         → running unplanned work while planner blocks await
 */
export interface FocusSignalInput {
  active: FocusSession | null;
  todaysSessions: FocusSession[];
  /** Whether the Planner has open (unstarted) blocks for today. */
  plannerBlocksPending: boolean;
  now: Date;
}

export function computeSignals(input: FocusSignalInput): FocusSignals {
  const { active, todaysSessions, plannerBlocksPending, now } = input;
  const status = active?.status ?? "idle";
  const isActive = active !== null && active.status !== "idle";

  const tooManyInterruptions =
    active !== null && active.interruptions.length >= HIGH_INTERRUPTION_COUNT;

  const longUnfinished =
    active !== null &&
    !active.completed &&
    WORK_TYPES.includes(active.type) &&
    isOverrunning(active, now) &&
    focusMinutesAt(active, now) > 0;

  // Drift: focusing on work that isn't tied to a planner block while planner blocks
  // are still waiting. Focus never reorders the planner — this just flags it.
  const plannerDrift =
    isActive && active !== null && active.plannerBlockId === null && plannerBlocksPending;

  return {
    active: isActive,
    status,
    tooManyInterruptions,
    longUnfinished,
    plannerDrift,
    focusMinutesToday: totalFocusMinutes(todaysSessions, now),
  };
}
