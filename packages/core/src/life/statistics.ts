import { VISION_CATEGORIES } from "./constants";
import type {
  Habit,
  HabitCompletion,
  LifeStatistics,
  Routine,
  RoutineCompletion,
  VisionItem,
  WorkoutSession,
} from "./types";
import { averageConsistency } from "./habits";
import { averageAdherence } from "./adherence";
import { trainingLoad } from "./workouts";

/**
 * Life statistics (Sprint 4.2). DERIVED life-balance + progress metrics. Never stored.
 */
export interface StatisticsInput {
  habits: Habit[];
  completions: HabitCompletion[];
  routines: Routine[];
  routineCompletions: RoutineCompletion[];
  workouts: WorkoutSession[];
  vision: VisionItem[];
  recovery: number; // 0..100 from readiness
  growthVelocity: number; // 0..100 supplied (goal velocity proxy)
  now: Date;
}

/** Life balance = how evenly vision items span the categories (0..100). */
function lifeBalance(vision: VisionItem[]): number {
  if (vision.length === 0) return 0;
  const covered = new Set(vision.map((v) => v.category));
  return Math.round((covered.size / VISION_CATEGORIES.length) * 100);
}

export function buildStatistics(input: StatisticsInput): LifeStatistics {
  const load = trainingLoad(input.workouts, input.now);
  const identity = input.vision.filter((v) => v.isIdentity).length;
  return {
    habitConsistency: averageConsistency(input.habits, input.completions, input.now),
    routineAdherence: averageAdherence(input.routines, input.routineCompletions, input.now),
    workoutLoad: load.weeklyVolume,
    recovery: Math.round(input.recovery),
    growthVelocity: Math.round(input.growthVelocity),
    lifeBalance: lifeBalance(input.vision),
    identityProgress:
      input.vision.length > 0 ? Math.round((identity / input.vision.length) * 100) : 0,
  };
}
