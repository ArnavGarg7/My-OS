import "server-only";
import { buildStatistics, correlate, type Correlation, type LifeStatistics } from "@myos/core/life";
import type { Database } from "@myos/db";
import * as repo from "./repository";
import { readiness } from "./summary";

/**
 * Life statistics + correlations (Sprint 4.2). Loads life collections + defers to the
 * pure core derivations. Correlations are pure Pearson calculations over paired series.
 */
export async function statistics(db: Database): Promise<LifeStatistics> {
  const now = new Date();
  const [habits, completions, routines, routineCompletions, workouts, vision, r] =
    await Promise.all([
      repo.listHabits(db),
      repo.listCompletions(db),
      repo.listRoutines(db),
      repo.listRoutineCompletions(db),
      repo.listWorkouts(db),
      repo.listVision(db),
      readiness(db),
    ]);
  return buildStatistics({
    habits,
    completions,
    routines,
    routineCompletions,
    workouts,
    vision,
    recovery: r.recovery,
    growthVelocity: vision.length > 0 ? 60 : 0, // deterministic proxy; refined once goal velocity feeds in
    now,
  });
}

/**
 * Correlations (Sprint 4.2). Pairs of daily series derived from life history — e.g.
 * habit completions ↔ workout volume by day. Pure statistical output.
 */
export async function correlations(db: Database): Promise<Correlation[]> {
  const [completions, workouts] = await Promise.all([
    repo.listCompletions(db),
    repo.listWorkouts(db),
  ]);

  // Build per-day series over the last 14 days.
  const days: string[] = [];
  const now = new Date();
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now);
    d.setUTCDate(d.getUTCDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }
  const habitByDay = days.map((day) => completions.filter((c) => c.date === day).length);
  const workoutByDay = days.map((day) =>
    workouts.filter((w) => w.date === day).reduce((n, w) => n + w.sets.length, 0),
  );

  return [correlate("Habits ↔ Workout volume", habitByDay, workoutByDay)];
}
