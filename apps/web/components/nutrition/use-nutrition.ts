"use client";

import { trpc } from "@/lib/trpc/client";

export function todayDateIso(now = new Date()): string {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
    now.getDate(),
  ).padStart(2, "0")}`;
}

/** Meal that best matches the current hour, as a sensible default. */
export function mealForNow(now = new Date()): "breakfast" | "lunch" | "dinner" | "snack" {
  const h = now.getHours();
  if (h < 11) return "breakfast";
  if (h < 15) return "lunch";
  if (h < 18) return "snack";
  return "dinner";
}

/** Nutrition data hook — day view + goals, with mutations that invalidate consistently. */
export function useNutrition() {
  const utils = trpc.useUtils();
  const date = todayDateIso();
  const day = trpc.nutrition.day.useQuery({ date });

  const invalidate = () => {
    void utils.nutrition.day.invalidate();
    void utils.nutrition.goals.invalidate();
  };
  const opts = { onSuccess: invalidate };

  return {
    date,
    day,
    resolveMeal: trpc.nutrition.resolveMeal.useMutation(),
    logFood: trpc.nutrition.logFood.useMutation(opts),
    removeFood: trpc.nutrition.removeFood.useMutation(opts),
    logWater: trpc.nutrition.logWater.useMutation(opts),
    logWeight: trpc.nutrition.logWeight.useMutation(opts),
    setGoals: trpc.nutrition.setGoals.useMutation(opts),
  };
}
