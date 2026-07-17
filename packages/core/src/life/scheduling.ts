import type { Routine } from "./types";

/**
 * Routine scheduling primitives (Sprint 4.2). Pure time math for laying a routine's steps
 * out from a start time. The Planner (planner.ts) consumes these to materialize blocks —
 * it never mutates the routine definition.
 */
export interface ScheduledStep {
  routineId: string;
  stepId: string;
  title: string;
  startMinutes: number; // minutes from midnight
  endMinutes: number;
}

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

export function minutesToHHMM(minutes: number): string {
  const m = ((minutes % 1440) + 1440) % 1440;
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}

/** Lay out a routine's ordered steps back-to-back from its start time (default 06:00). */
export function scheduleRoutine(routine: Routine, defaultStart = "06:00"): ScheduledStep[] {
  let cursor = toMinutes(routine.startTime ?? defaultStart);
  const steps = [...routine.steps].sort((a, b) => a.order - b.order);
  return steps.map((s) => {
    const startMinutes = cursor;
    const endMinutes = cursor + Math.max(1, s.durationMinutes);
    cursor = endMinutes;
    return { routineId: routine.id, stepId: s.id, title: s.title, startMinutes, endMinutes };
  });
}
