import "server-only";
import {
  averageConsistency,
  buildSummary,
  completionsFor,
  computeReadiness,
  computeStreaks,
  defaultInputs,
  dueMedications,
  injuryBurden,
  trainingLoad,
  type LifeSummary,
  type Readiness,
  type ReadinessInputs,
  type StreakInfo,
} from "@myos/core/life";
import type { Database } from "@myos/db";
import * as repo from "./repository";

/**
 * Life summary + readiness (Sprint 4.2). Loads life collections and defers to the pure
 * core derivations. Readiness uses life-derived inputs (habit consistency, injury burden,
 * workout load) over neutral health baselines — the life domain owns NO health logic;
 * the Health engine (2.9) remains the source of sleep/recovery/hydration/nutrition.
 */
export async function readinessInputs(db: Database, now = new Date()): Promise<ReadinessInputs> {
  const [habits, completions, injuries, workouts, medications, medicationLogs] = await Promise.all([
    repo.listHabits(db),
    repo.listCompletions(db),
    repo.listInjuries(db),
    repo.listWorkouts(db),
    repo.listMedications(db),
    repo.listMedicationLogs(db),
  ]);
  return {
    ...defaultInputs(),
    habitConsistency: averageConsistency(habits, completions, now),
    injuryBurden: injuryBurden(injuries),
    workoutLoad: trainingLoad(workouts, now).weeklyVolume,
    medicationDue: dueMedications(medications, medicationLogs, now).length > 0,
  };
}

export async function readiness(db: Database): Promise<Readiness> {
  return computeReadiness(await readinessInputs(db));
}

/** Per-habit streak info (derived, never stored). */
export async function habitStreaks(db: Database): Promise<(StreakInfo & { habitId: string })[]> {
  const now = new Date();
  const [habits, completions] = await Promise.all([repo.listHabits(db), repo.listCompletions(db)]);
  return habits
    .filter((h) => !h.archived)
    .map((h) => ({ habitId: h.id, ...computeStreaks(h, completionsFor(completions, h.id), now) }));
}

export async function summary(db: Database): Promise<LifeSummary> {
  const now = new Date();
  const [
    habits,
    completions,
    routines,
    routineCompletions,
    medications,
    medicationLogs,
    workouts,
    r,
  ] = await Promise.all([
    repo.listHabits(db),
    repo.listCompletions(db),
    repo.listRoutines(db),
    repo.listRoutineCompletions(db),
    repo.listMedications(db),
    repo.listMedicationLogs(db),
    repo.listWorkouts(db),
    readiness(db),
  ]);
  return buildSummary({
    habits,
    completions,
    routines,
    routineCompletions,
    medications,
    medicationLogs,
    workouts,
    readiness: r.score,
    now,
  });
}
