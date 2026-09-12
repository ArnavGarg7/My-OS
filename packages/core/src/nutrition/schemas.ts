import { z } from "zod";

/** Zod input contracts for the Nutrition API (shared by the tRPC router). */

export const mealTypeSchema = z.enum(["breakfast", "lunch", "dinner", "snack"]);
const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "expected YYYY-MM-DD");
const idString = z.string().uuid();

/** Parse + resolve a typed/spoken meal against the food DB (returns candidates to review). */
export const resolveMealSchema = z.object({
  text: z.string().min(1).max(500),
  meal: mealTypeSchema.optional(),
});

/** Direct food-DB search (manual add). */
export const searchFoodSchema = z.object({ query: z.string().min(1).max(200) });

/** Commit a chosen food to the log (macros already resolved from the DB / entered manually). */
export const logFoodSchema = z.object({
  meal: mealTypeSchema,
  name: z.string().min(1).max(200),
  brand: z.string().max(200).optional(),
  quantity: z.number().positive().max(100000).optional(),
  unit: z.string().max(40).optional(),
  calories: z.number().min(0).max(100000),
  protein: z.number().min(0).max(10000),
  carbs: z.number().min(0).max(10000),
  fat: z.number().min(0).max(10000),
  fiber: z.number().min(0).max(10000).optional(),
  sugar: z.number().min(0).max(10000).optional(),
  sodium: z.number().min(0).max(1000000).optional(),
  source: z.enum(["usda", "off", "manual", "ai"]).optional(),
  sourceRef: z.string().max(80).optional(),
  /** Planned meal (true) vs actually consumed (false, default). */
  planned: z.boolean().optional(),
  /** The owner-local day this belongs to (defaults to today, server-side). */
  consumedOn: dateString.optional(),
});

export const logWaterSchema = z.object({
  amountMl: z.number().int().positive().max(5000),
  source: z.string().max(40).optional(),
  /** Owner-local day the water counts toward (defaults to today). */
  date: dateString.optional(),
});

export const logWeightSchema = z.object({
  weight: z.number().positive().max(700),
  bodyFat: z.number().min(0).max(100).optional(),
  recordedOn: dateString.optional(),
});

export const setGoalsSchema = z
  .object({
    calorieTarget: z.number().int().min(0).max(20000),
    proteinTarget: z.number().min(0).max(2000),
    carbsTarget: z.number().min(0).max(3000),
    fatTarget: z.number().min(0).max(2000),
    waterMlTarget: z.number().int().min(0).max(20000),
  })
  .partial();

export const nutritionDaySchema = z.object({ date: dateString });
export const nutritionIdSchema = z.object({ id: idString });

/** A single food item the deterministic parser read from an utterance (server resolves each). */
export const parsedFoodItemSchema = z.object({
  food: z.string().min(1).max(200),
  quantity: z.number().positive().optional(),
  unit: z.string().max(40).optional(),
});

export type ResolveMealInput = z.infer<typeof resolveMealSchema>;
export type LogFoodInput = z.infer<typeof logFoodSchema>;
export type LogWaterInput = z.infer<typeof logWaterSchema>;
export type LogWeightInput = z.infer<typeof logWeightSchema>;
export type SetGoalsInput = z.infer<typeof setGoalsSchema>;
