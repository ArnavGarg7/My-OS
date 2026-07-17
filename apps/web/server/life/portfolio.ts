import "server-only";
import { buildPortfolio, type LifePortfolio } from "@myos/core/life";
import type { Database } from "@myos/db";
import * as repo from "./repository";

/**
 * Life portfolio (Sprint 4.2). Loads life collections + defers to the pure core
 * derivation. Fully derived; nothing extra stored.
 */
export async function portfolio(db: Database): Promise<LifePortfolio> {
  const [habits, completions, routines, medications, injuries, appointments, workouts, vision] =
    await Promise.all([
      repo.listHabits(db),
      repo.listCompletions(db),
      repo.listRoutines(db),
      repo.listMedications(db),
      repo.listInjuries(db),
      repo.listAppointments(db),
      repo.listWorkouts(db),
      repo.listVision(db),
    ]);
  return buildPortfolio({
    habits,
    completions,
    routines,
    medications,
    injuries,
    appointments,
    workouts,
    vision,
    now: new Date(),
  });
}
