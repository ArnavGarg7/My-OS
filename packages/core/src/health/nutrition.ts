import { DEFAULT_GOALS, KCAL_PER_GRAM } from "./constants";
import type { NutritionLog, NutritionSummary } from "./types";

/**
 * Nutrition engine (Sprint 2.9). Deterministic macro totals, calories/protein
 * remaining and the macro distribution. Aggregate macros only — no food
 * databases or barcode scanning (deferred).
 */
export function summarizeNutrition(
  logs: NutritionLog[],
  goals: { calories: number; proteinG: number } = DEFAULT_GOALS,
): NutritionSummary {
  const calories = sum(logs, "calories");
  const protein = sum(logs, "protein");
  const carbs = sum(logs, "carbs");
  const fat = sum(logs, "fat");
  return {
    calories,
    protein,
    carbs,
    fat,
    caloriesRemaining: Math.max(0, goals.calories - calories),
    proteinRemaining: Math.max(0, goals.proteinG - protein),
    macroSplit: macroSplit(protein, carbs, fat),
  };
}

/** Macro distribution as percentages of caloric intake (sums to ~100). */
export function macroSplit(
  protein: number,
  carbs: number,
  fat: number,
): { protein: number; carbs: number; fat: number } {
  const pCal = protein * KCAL_PER_GRAM.protein;
  const cCal = carbs * KCAL_PER_GRAM.carbs;
  const fCal = fat * KCAL_PER_GRAM.fat;
  const total = pCal + cCal + fCal;
  if (total === 0) return { protein: 0, carbs: 0, fat: 0 };
  return {
    protein: Math.round((pCal / total) * 100),
    carbs: Math.round((cCal / total) * 100),
    fat: Math.round((fCal / total) * 100),
  };
}

function sum(logs: NutritionLog[], key: "calories" | "protein" | "carbs" | "fat"): number {
  return logs.reduce((s, l) => s + Math.max(0, l[key]), 0);
}
