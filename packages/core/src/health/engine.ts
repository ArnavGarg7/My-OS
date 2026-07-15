import { DEFAULT_GOALS, type EnergyLevel } from "./constants";
import { analyzeSleep } from "./sleep";
import { summarizeHydration } from "./hydration";
import { summarizeNutrition } from "./nutrition";
import { summarizeWorkouts, lastWorkoutType, completeWorkout, estimateCalories } from "./workout";
import { assessRecovery } from "./recovery";
import { computeReadiness } from "./readiness";
import { resolveEnergy } from "./energy";
import { MIN_HEALTHY_SLEEP_MINUTES, READINESS_BANDS } from "./constants";
import type {
  BodyMeasurement,
  HealthDaily,
  HealthSignals,
  HealthSummary,
  HydrationLog,
  NutritionLog,
  SleepSession,
  Workout,
} from "./types";

/**
 * HealthEngine (Sprint 2.9). Pure deterministic orchestration over the health
 * sub-engines: sleep → recovery → readiness alongside hydration / nutrition /
 * energy → a single HealthSummary and the cross-module HealthSignals. No React,
 * DB, browser or randomness. Not medical advice.
 */
export interface HealthInput {
  date: string;
  daily: HealthDaily | null;
  latestSleep: SleepSession | null;
  sleepHistory: SleepSession[];
  workouts: Workout[]; // today
  recentWorkouts: Workout[]; // last ~2 days (for recovery)
  hydration: HydrationLog[];
  nutrition: NutritionLog[];
  body: BodyMeasurement[];
  goals?: { waterMl: number; calories: number; proteinG: number };
  now?: Date;
}

export class HealthEngine {
  summary(input: HealthInput): HealthSummary {
    const goals = input.goals ?? DEFAULT_GOALS;
    const sleep = analyzeSleep(input.latestSleep, input.sleepHistory);
    const hydration = summarizeHydration(input.hydration, goals.waterMl, input.now);
    const nutrition = summarizeNutrition(input.nutrition, goals);
    const workouts = summarizeWorkouts(input.workouts);
    const energy = resolveEnergy(input.daily?.energyLevel ?? null, sleep);
    const recovery = assessRecovery({
      sleep,
      recentWorkouts: input.recentWorkouts,
      energy: input.daily?.energyLevel ?? null,
    });
    const readiness = computeReadiness({ sleep, recovery, hydration, energy });

    return {
      date: input.date,
      sleep,
      recovery,
      readiness,
      hydration,
      nutrition,
      workouts,
      energy,
      weight: input.daily?.weight ?? input.body.at(-1)?.weight ?? null,
    };
  }

  /** Deterministic signals for Decision / Planner / Morning. */
  signals(input: HealthInput): HealthSignals {
    const s = this.summary(input);
    const sleepMinutes = s.sleep?.durationMinutes ?? 0;
    return {
      readiness: s.readiness.score,
      recovery: s.recovery.status,
      sleepMinutes,
      energy: s.energy.level,
      hydrationPercent: s.hydration.completionPercent,
      lowSleep: sleepMinutes > 0 && sleepMinutes < MIN_HEALTHY_SLEEP_MINUTES,
      highReadiness: s.readiness.score >= READINESS_BANDS.high,
      nextWorkoutType: lastWorkoutType(input.recentWorkouts),
    };
  }

  completeWorkout(workout: Workout, endedAt: string): Workout {
    return completeWorkout(workout, endedAt);
  }

  estimateWorkoutCalories(
    type: Workout["type"],
    durationMinutes: number,
    rpe: number | null,
  ): number {
    return estimateCalories(type, durationMinutes, rpe);
  }

  /** Merge a manual energy change into a daily record. */
  setEnergy(daily: HealthDaily, level: EnergyLevel): HealthDaily {
    return { ...daily, energyLevel: level };
  }
}

export const healthEngine = new HealthEngine();
