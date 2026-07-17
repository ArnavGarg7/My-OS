import type { Routine } from "./types";
import { minutesToHHMM, scheduleRoutine, type ScheduledStep } from "./scheduling";

/**
 * Routine → Planner materialization (Sprint 4.2). Produces deterministic block DRAFTS the
 * Planner can persist as its own blocks. This module READS routines and NEVER mutates
 * them — the routine definition is the single source of truth; the Planner owns the
 * materialized blocks. (Architecture: "Planner consumes routines but never owns them.")
 */
export interface RoutineBlockDraft {
  routineId: string;
  stepId: string;
  title: string;
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  durationMinutes: number;
  source: "routine";
}

/** Materialize one routine into ordered block drafts for a day. */
export function materializeRoutine(routine: Routine, defaultStart = "06:00"): RoutineBlockDraft[] {
  return scheduleRoutine(routine, defaultStart).map((s: ScheduledStep) => ({
    routineId: s.routineId,
    stepId: s.stepId,
    title: s.title,
    startTime: minutesToHHMM(s.startMinutes),
    endTime: minutesToHHMM(s.endMinutes),
    durationMinutes: s.endMinutes - s.startMinutes,
    source: "routine" as const,
  }));
}

/** Materialize every active routine into a single sorted list of block drafts. */
export function materializeRoutines(routines: Routine[]): RoutineBlockDraft[] {
  return routines
    .filter((r) => r.status === "active")
    .flatMap((r) => materializeRoutine(r))
    .sort((a, b) => a.startTime.localeCompare(b.startTime));
}
