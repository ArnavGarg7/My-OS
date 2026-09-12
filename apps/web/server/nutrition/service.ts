import "server-only";
import type { Database } from "@myos/db";
import {
  gramsForPortion,
  goalProgress,
  parseMealText,
  totalMacros,
  type LogFoodInput,
  type LogWaterInput,
  type LogWeightInput,
  type ResolveMealInput,
  type SetGoalsInput,
} from "@myos/core/nutrition";
import * as repo from "./repository";
import { searchFoodDb } from "./food-db";

/**
 * NutritionService. Parses a meal utterance (deterministic core), resolves each food against USDA (the
 * source of truth), and — once the user confirms a portion client-side — logs it, keeping the Health
 * day rollup in sync. Water/weight reuse the existing Health tables. Nothing here invents macros.
 */
const DEFAULT_GOALS = {
  calorieTarget: 2000,
  proteinTarget: 120,
  carbsTarget: 220,
  fatTarget: 70,
  waterMlTarget: 2500,
};

function todayUtc(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Parse + resolve a typed/spoken meal into review-ready items (each with DB candidates). */
export async function resolveMeal(db: Database, input: ResolveMealInput) {
  void db;
  const parsed = parseMealText(input.text);
  const items = await Promise.all(
    parsed.map(async (it) => {
      const search = await searchFoodDb(it.food);
      const top = search.candidates[0];
      return {
        query: it.food,
        quantity: it.quantity ?? null,
        unit: it.unit ?? null,
        /** Grams if derivable from the portion; null → the UI asks the user for the amount. */
        suggestedGrams: gramsForPortion(it.quantity, it.unit, top?.servingGrams),
        candidates: search.candidates,
        error: search.ok ? undefined : search.error,
      };
    }),
  );
  return { meal: input.meal ?? null, items };
}

/** Direct food-DB search for the manual-add flow. */
export async function searchFood(_db: Database, query: string) {
  return searchFoodDb(query);
}

// ── Logging ──────────────────────────────────────────────────────────────────
export async function logFood(db: Database, input: LogFoodInput) {
  const date = input.consumedOn ?? todayUtc();
  const planned = input.planned ?? false;
  const row = await repo.insertLog(db, {
    meal: input.meal,
    name: input.name,
    brand: input.brand ?? "",
    quantity: input.quantity ?? null,
    unit: input.unit ?? "",
    calories: Math.round(input.calories),
    protein: input.protein,
    carbs: input.carbs,
    fat: input.fat,
    fiber: input.fiber ?? null,
    sugar: input.sugar ?? null,
    sodium: input.sodium ?? null,
    source: input.source ?? "manual",
    sourceRef: input.sourceRef ?? "",
    planned,
    consumedOn: date,
  });
  if (!planned) await repo.recomputeDailyMacros(db, date);
  return row;
}

export async function removeFood(db: Database, id: string) {
  const date = await repo.deleteLog(db, id);
  if (date) await repo.recomputeDailyMacros(db, date);
  return { ok: true as const };
}

export async function logWater(db: Database, input: LogWaterInput) {
  const date = input.date ?? todayUtc();
  await repo.insertHydration(db, input.amountMl, input.source ?? "water");
  await repo.addWaterToDaily(db, date, input.amountMl);
  return { ok: true as const };
}

export async function logWeight(db: Database, input: LogWeightInput) {
  const date = input.recordedOn ?? todayUtc();
  await repo.insertBodyMeasurement(db, {
    weight: input.weight,
    ...(input.bodyFat !== undefined ? { bodyFat: input.bodyFat } : {}),
  });
  await repo.setDailyWeight(db, date, input.weight);
  return { ok: true as const };
}

// ── Goals ────────────────────────────────────────────────────────────────────
export async function getGoals(db: Database) {
  const row = await repo.getActiveGoals(db);
  return row ?? DEFAULT_GOALS;
}
export function setGoals(db: Database, input: SetGoalsInput) {
  // Strip undefined keys so the partial patch satisfies exactOptionalPropertyTypes.
  const patch = Object.fromEntries(Object.entries(input).filter(([, v]) => v !== undefined));
  return repo.upsertGoals(db, patch);
}

// ── Day view ───────────────────────────────────────────────────────────────────
export async function day(db: Database, date: string) {
  const [logs, daily, goalsRow] = await Promise.all([
    repo.listLogsForDay(db, date),
    repo.getDaily(db, date),
    repo.getActiveGoals(db),
  ]);
  const goals = goalsRow ?? DEFAULT_GOALS;
  const macroLogs = logs.map((l) => ({
    calories: l.calories,
    protein: l.protein,
    carbs: l.carbs,
    fat: l.fat,
    planned: l.planned,
  }));
  const consumed = totalMacros(macroLogs, false);
  const planned = totalMacros(macroLogs, true);
  return {
    date,
    logs,
    goals,
    consumed,
    planned,
    progress: goalProgress(consumed, goals),
    waterMl: daily?.waterMl ?? 0,
    waterTarget: goals.waterMlTarget,
    weight: daily?.weight ?? null,
  };
}

export async function weightTrend(db: Database) {
  const rows = await repo.recentWeights(db, 30);
  return rows.reverse();
}
