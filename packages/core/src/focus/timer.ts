import { OVERRUN_MINUTES } from "./constants";
import type { FocusSession, TimerState } from "./types";

/**
 * Pure focus timer (Sprint 3.2). No browser timers, no `Date.now()` — every value
 * is derived from the session's stored timestamps and a `now` passed by the caller.
 * The UI ticks with setInterval and calls these functions; the engine and server
 * call them with a fixed clock. Same inputs → same outputs, always.
 */

const MIN_MS = 60_000;

function ms(iso: string | null): number | null {
  if (!iso) return null;
  const t = Date.parse(iso);
  return Number.isNaN(t) ? null : t;
}

/**
 * Total paused/break time accumulated at `now`, in ms. Includes the live pause
 * (from `pausedAt` to `now`) when the session is currently paused/on-break.
 */
export function pausedMsAt(session: FocusSession, now: Date): number {
  const base = Math.max(0, session.pausedDurationMs);
  const pausedAt = ms(session.pausedAt);
  if (pausedAt === null) return base;
  const live = Math.max(0, now.getTime() - pausedAt);
  return base + live;
}

/** Effective focus time in ms: wall time since start minus all paused/break time. */
export function focusMsAt(session: FocusSession, now: Date): number {
  const start = ms(session.startedAt);
  if (start === null) return 0;
  const end = ms(session.endedAt) ?? now.getTime();
  const elapsed = Math.max(0, end - start);
  const paused = pausedMsAt(session, now);
  return Math.max(0, elapsed - paused);
}

/** Full timer read-model for a session at `now`. */
export function computeTimer(session: FocusSession, now: Date): TimerState {
  const start = ms(session.startedAt);
  const plannedMs = Math.max(0, session.plannedMinutes) * MIN_MS;

  if (start === null) {
    return {
      status: session.status,
      elapsedMs: 0,
      focusMs: 0,
      pausedMs: 0,
      remainingMs: plannedMs,
      plannedMs,
      overrunMs: 0,
      estimatedFinish: null,
      progress: 0,
      interruptions: session.interruptions.length,
    };
  }

  const end = ms(session.endedAt) ?? now.getTime();
  const elapsedMs = Math.max(0, end - start);
  const pausedMs = pausedMsAt(session, now);
  const focusMs = Math.max(0, elapsedMs - pausedMs);
  const remainingMs = Math.max(0, plannedMs - focusMs);
  const overrunMs = Math.max(0, focusMs - plannedMs);
  const progress = plannedMs === 0 ? 100 : Math.min(100, Math.round((focusMs / plannedMs) * 100));

  // Estimated finish: from `now`, how long until remaining focus is exhausted. If
  // paused, the clock is not advancing, so the estimate simply pushes out by the
  // remaining amount from `now` once resumed.
  const estimatedFinish =
    session.endedAt !== null
      ? session.endedAt
      : remainingMs === 0
        ? new Date(now.getTime()).toISOString()
        : new Date(now.getTime() + remainingMs).toISOString();

  return {
    status: session.status,
    elapsedMs,
    focusMs,
    pausedMs,
    remainingMs,
    plannedMs,
    overrunMs,
    estimatedFinish,
    progress,
    interruptions: session.interruptions.length,
  };
}

/** Whole minutes of effective focus at `now`. */
export function focusMinutesAt(session: FocusSession, now: Date): number {
  return Math.floor(focusMsAt(session, now) / MIN_MS);
}

/** True when the session has run past its planned length by the overrun threshold. */
export function isOverrunning(session: FocusSession, now: Date): boolean {
  return computeTimer(session, now).overrunMs >= OVERRUN_MINUTES * MIN_MS;
}
