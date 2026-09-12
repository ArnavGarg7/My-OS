import { z } from "zod";
import { EXERCISE_TYPES } from "./constants";

/**
 * Built-in exercise catalog for the guided workout logger. Deterministic reference content (like the
 * nutrition/timetable structure): cardio exercises + strength exercises grouped by muscle group, each
 * with sensible default logging (duration for cardio, sets×reps×weight for strength). The picker uses
 * this; on save each chosen exercise is upserted into the user's exercise_library so their PR library
 * builds itself. Everything stays editable — nothing here is fabricated data, only a starting menu.
 */
export interface CatalogExercise {
  name: string;
  /** Maps to the exercise_library `type` enum. */
  type: "cardio" | "strength";
  /** Muscle group for strength work (absent for cardio). */
  muscleGroup?: string;
}

export const MUSCLE_GROUPS = [
  "Chest",
  "Back",
  "Legs",
  "Shoulders",
  "Biceps",
  "Triceps",
  "Core",
] as const;

export const CARDIO_EXERCISES: CatalogExercise[] = [
  "Running",
  "Cycling",
  "Rowing",
  "Jump Rope",
  "Swimming",
  "Elliptical",
  "Stair Climber",
  "Incline Walk",
  "HIIT",
].map((name) => ({ name, type: "cardio" as const }));

const STRENGTH: Record<(typeof MUSCLE_GROUPS)[number], string[]> = {
  Chest: ["Bench Press", "Incline Dumbbell Press", "Push-up", "Cable Fly", "Chest Dip"],
  Back: ["Deadlift", "Pull-up", "Barbell Row", "Lat Pulldown", "Seated Cable Row"],
  Legs: ["Squat", "Leg Press", "Romanian Deadlift", "Walking Lunge", "Leg Curl", "Calf Raise"],
  Shoulders: ["Overhead Press", "Lateral Raise", "Face Pull", "Arnold Press", "Rear Delt Fly"],
  Biceps: ["Barbell Curl", "Dumbbell Curl", "Hammer Curl", "Preacher Curl"],
  Triceps: ["Tricep Pushdown", "Skull Crusher", "Overhead Extension", "Close-Grip Bench"],
  Core: ["Plank", "Hanging Leg Raise", "Cable Crunch", "Russian Twist", "Ab Wheel Rollout"],
};

/** Strength exercises grouped by muscle group, as CatalogExercise entries. */
export const STRENGTH_BY_GROUP: Record<string, CatalogExercise[]> = Object.fromEntries(
  MUSCLE_GROUPS.map((group) => [
    group,
    STRENGTH[group].map((name) => ({ name, type: "strength" as const, muscleGroup: group })),
  ]),
);

// ── Guided workout logging input ─────────────────────────────────────────────────
const guidedSet = z.object({
  reps: z.number().int().min(0).max(1000).optional(),
  weight: z.number().min(0).max(10000).optional(),
  durationMinutes: z.number().min(0).max(600).optional(),
  intensity: z.number().int().min(1).max(10).optional(),
});
export const guidedWorkoutEntrySchema = z.object({
  name: z.string().min(1).max(100),
  type: z.enum(EXERCISE_TYPES).optional(),
  muscleGroups: z.array(z.string().max(50)).max(10).optional(),
  sets: z.array(guidedSet).min(1).max(30),
});
export const logGuidedWorkoutSchema = z.object({
  entries: z.array(guidedWorkoutEntrySchema).min(1).max(30),
  perceivedExertion: z.number().int().min(1).max(10).optional(),
  recoveryNotes: z.string().max(2000).optional(),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "expected YYYY-MM-DD")
    .optional(),
});

export type GuidedWorkoutEntry = z.infer<typeof guidedWorkoutEntrySchema>;
export type LogGuidedWorkoutInput = z.infer<typeof logGuidedWorkoutSchema>;
