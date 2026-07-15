import { CALORIE_PER_MIN, RPE_MAX, RPE_MIN } from "./constants";
import type { Workout, WorkoutSummary } from "./types";
import type { WorkoutType } from "./constants";

/**
 * Workout engine (Sprint 2.9). Owns sessions, volume, intensity and a
 * deterministic calorie estimate. Recovery signals are derived from these by the
 * recovery engine — this module only summarizes the sessions themselves.
 */
export function estimateCalories(
  type: WorkoutType,
  durationMinutes: number,
  rpe: number | null,
): number {
  const base = CALORIE_PER_MIN[type] * Math.max(0, durationMinutes);
  // Scale ±25% by intensity around RPE 5.
  const intensity = rpe === null ? 1 : 1 + ((clampRpe(rpe) - 5) / 5) * 0.25;
  return Math.round(base * intensity);
}

export function clampRpe(rpe: number): number {
  return Math.max(RPE_MIN, Math.min(RPE_MAX, rpe));
}

/** Intensity band from RPE for planner/recovery hints. */
export function intensityBand(rpe: number | null): "light" | "moderate" | "hard" | "max" {
  if (rpe === null) return "moderate";
  const r = clampRpe(rpe);
  if (r <= 3) return "light";
  if (r <= 6) return "moderate";
  if (r <= 8) return "hard";
  return "max";
}

export function completeWorkout(workout: Workout, endedAt: string): Workout {
  const duration =
    workout.durationMinutes > 0
      ? workout.durationMinutes
      : Math.max(
          0,
          Math.round((new Date(endedAt).getTime() - new Date(workout.startedAt).getTime()) / 60000),
        );
  return {
    ...workout,
    endedAt,
    durationMinutes: duration,
    caloriesBurned: workout.caloriesBurned || estimateCalories(workout.type, duration, workout.rpe),
    completed: true,
  };
}

export function summarizeWorkouts(workouts: Workout[]): WorkoutSummary {
  const done = workouts.filter((w) => w.completed);
  const rpes = done.map((w) => w.rpe).filter((r): r is number => r !== null);
  return {
    count: done.length,
    totalMinutes: done.reduce((s, w) => s + w.durationMinutes, 0),
    totalVolume: done.reduce((s, w) => s + w.volume, 0),
    caloriesBurned: done.reduce((s, w) => s + w.caloriesBurned, 0),
    averageRpe: rpes.length
      ? Math.round((rpes.reduce((s, r) => s + r, 0) / rpes.length) * 10) / 10
      : null,
  };
}

/** The most recent completed workout's type — a hint for "next workout". */
export function lastWorkoutType(workouts: Workout[]): WorkoutType | null {
  const done = workouts.filter((w) => w.completed && w.endedAt);
  if (done.length === 0) return null;
  return done.sort((a, b) => (a.endedAt ?? "").localeCompare(b.endedAt ?? "")).at(-1)!.type;
}

/** Total training load over the sessions (volume-weighted by intensity). */
export function trainingLoad(workouts: Workout[]): number {
  return Math.round(
    workouts
      .filter((w) => w.completed)
      .reduce((s, w) => s + w.durationMinutes * (w.rpe === null ? 1 : clampRpe(w.rpe) / 5), 0),
  );
}
