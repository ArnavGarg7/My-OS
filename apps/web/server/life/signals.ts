import "server-only";
import { computeSignals, type LifeSignals } from "@myos/core/life";
import type { Database } from "@myos/db";
import * as repo from "./repository";
import { readiness } from "./summary";

/**
 * Life signals (Sprint 4.2) for the Decision engine. Deterministic booleans derived from
 * habits, routines, medications, appointments, workouts and readiness. The Decision
 * engine turns these into recommendations; life never emits decisions itself.
 */
export async function signals(db: Database): Promise<LifeSignals> {
  const now = new Date();
  const [
    habits,
    completions,
    routines,
    routineCompletions,
    medications,
    medicationLogs,
    appointments,
    workouts,
    r,
  ] = await Promise.all([
    repo.listHabits(db),
    repo.listCompletions(db),
    repo.listRoutines(db),
    repo.listRoutineCompletions(db),
    repo.listMedications(db),
    repo.listMedicationLogs(db),
    repo.listAppointments(db),
    repo.listWorkouts(db),
    readiness(db),
  ]);
  return computeSignals({
    habits,
    completions,
    routines,
    routineCompletions,
    medications,
    medicationLogs,
    appointments,
    workouts,
    recovery: r.recovery,
    identityGoalStalled: false, // refined once Goal velocity feeds in (Phase 5)
    now,
  });
}
