import { ROUTINE_SKIP_DAYS } from "./constants";
import type { Routine, RoutineCompletion } from "./types";

/**
 * Routine engine (Sprint 4.2). Pure read helpers over routines + their completions.
 * Routines own their step definitions; the Planner materializes them into blocks without
 * mutating the routine (see planner.ts). Independent of the Habit engine.
 */
export function activeRoutines(routines: Routine[]): Routine[] {
  return routines.filter((r) => r.status === "active");
}

export function totalDuration(routine: Routine): number {
  return routine.steps.reduce((n, s) => n + s.durationMinutes, 0);
}

function ymd(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Routine ids completed today. */
export function routinesCompletedToday(
  routines: Routine[],
  completions: RoutineCompletion[],
  now: Date,
): Set<string> {
  const today = ymd(now);
  return new Set(completions.filter((c) => c.date === today).map((c) => c.routineId));
}

/** A routine is "skipped" if active, not completed today, and it's past its start time window. */
export function skippedRoutines(
  routines: Routine[],
  completions: RoutineCompletion[],
  now: Date,
): Routine[] {
  const doneToday = routinesCompletedToday(routines, completions, now);
  const nowMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();
  return activeRoutines(routines).filter((r) => {
    if (doneToday.has(r.id)) return false;
    if (!r.startTime) return false;
    const [h, m] = r.startTime.split(":").map(Number);
    const start = (h ?? 0) * 60 + (m ?? 0);
    return nowMinutes > start + ROUTINE_SKIP_DAYS * 60; // more than an hour past start
  });
}

/** The next active routine to run today by start time (earliest not-yet-done). */
export function nextRoutine(
  routines: Routine[],
  completions: RoutineCompletion[],
  now: Date,
): Routine | null {
  const doneToday = routinesCompletedToday(routines, completions, now);
  const nowMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();
  const candidates = activeRoutines(routines)
    .filter((r) => !doneToday.has(r.id) && r.startTime)
    .map((r) => {
      const [h, m] = r.startTime!.split(":").map(Number);
      return { r, start: (h ?? 0) * 60 + (m ?? 0) };
    })
    .filter((x) => x.start >= nowMinutes)
    .sort((a, b) => a.start - b.start);
  return candidates[0]?.r ?? null;
}
