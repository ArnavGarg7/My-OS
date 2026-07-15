import { HIGH_INTERRUPTION_COUNT, type InterruptionType } from "./constants";
import type { FocusSession, Interruption } from "./types";

/**
 * Interruption helpers (Sprint 3.2). Interruptions are stored with a timestamp and
 * type; metrics derive from them. Pure — no clock, ids passed in.
 */
export function makeInterruption(
  id: string,
  type: InterruptionType,
  now: Date,
  note?: string,
): Interruption {
  return {
    id,
    type,
    at: now.toISOString(),
    ...(note ? { note } : {}),
  };
}

/** Count interruptions of a given type. */
export function countByType(session: FocusSession, type: InterruptionType): number {
  return session.interruptions.filter((i) => i.type === type).length;
}

/** Group interruption counts by type (all types present, zero-filled). */
export function interruptionBreakdown(session: FocusSession): Record<InterruptionType, number> {
  const base: Record<InterruptionType, number> = {
    phone: 0,
    meeting: 0,
    message: 0,
    distraction: 0,
    other: 0,
  };
  for (const i of session.interruptions) base[i.type] += 1;
  return base;
}

/** True when the session has crossed the "too many interruptions" threshold. */
export function hasTooManyInterruptions(session: FocusSession): boolean {
  return session.interruptions.length >= HIGH_INTERRUPTION_COUNT;
}
