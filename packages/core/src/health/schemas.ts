import { z } from "zod";
import { ENERGY_LEVELS, HYDRATION_SOURCES, MEAL_TYPES, MOODS, WORKOUT_TYPES } from "./constants";

/**
 * Health input validation (Sprint 2.9). Shared by tRPC + the service. All log
 * inputs are manual (no wearable sync yet).
 */
const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const isoSchema = z.string().datetime();

export const rangeSchema = z.object({ date: dateSchema.optional() });

export const logWaterSchema = z.object({
  amountMl: z.number().int().min(1).max(5000),
  source: z.enum(HYDRATION_SOURCES).default("water"),
  time: isoSchema.optional(),
});

export const logMealSchema = z.object({
  meal: z.enum(MEAL_TYPES),
  calories: z.number().min(0).max(10000),
  protein: z.number().min(0).max(1000).default(0),
  carbs: z.number().min(0).max(1000).default(0),
  fat: z.number().min(0).max(1000).default(0),
  loggedAt: isoSchema.optional(),
});

export const logWorkoutSchema = z.object({
  type: z.enum(WORKOUT_TYPES),
  durationMinutes: z.number().int().min(1).max(600),
  volume: z.number().min(0).max(100000).default(0),
  rpe: z.number().int().min(1).max(10).nullable().default(null),
  startedAt: isoSchema.optional(),
  completed: z.boolean().default(true),
});

export const finishWorkoutSchema = z.object({
  id: z.string().uuid(),
  endedAt: isoSchema.optional(),
});

export const logSleepSchema = z.object({
  bedTime: isoSchema,
  wakeTime: isoSchema,
  quality: z.number().int().min(0).max(100).default(70),
});

export const updateWeightSchema = z.object({
  weight: z.number().min(20).max(400),
  bodyFat: z.number().min(1).max(70).nullable().optional(),
  muscleMass: z.number().min(1).max(200).nullable().optional(),
  waist: z.number().min(20).max(300).nullable().optional(),
  recordedAt: isoSchema.optional(),
});

export const updateEnergySchema = z.object({
  date: dateSchema.optional(),
  energyLevel: z.enum(ENERGY_LEVELS),
});

export const updateMoodSchema = z.object({
  date: dateSchema.optional(),
  mood: z.enum(MOODS),
  stress: z.number().int().min(0).max(10).optional(),
});

export const trendsSchema = z.object({ days: z.number().int().min(1).max(90).default(30) });

export type LogWaterInput = z.infer<typeof logWaterSchema>;
export type LogMealInput = z.infer<typeof logMealSchema>;
export type LogWorkoutInput = z.infer<typeof logWorkoutSchema>;
export type LogSleepInput = z.infer<typeof logSleepSchema>;
export type UpdateWeightInput = z.infer<typeof updateWeightSchema>;
export type UpdateEnergyInput = z.infer<typeof updateEnergySchema>;
