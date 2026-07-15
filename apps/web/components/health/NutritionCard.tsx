"use client";

import { Apple } from "lucide-react";
import { Progress, Text } from "@myos/ui";
import type { NutritionSummary } from "@myos/core/health";

/** Nutrition card (Sprint 2.9): calories + macros with remaining. */
export function NutritionCard({ nutrition }: { nutrition: NutritionSummary }) {
  const consumed = nutrition.calories;
  const goal = consumed + nutrition.caloriesRemaining;
  const percent = goal > 0 ? Math.min(100, Math.round((consumed / goal) * 100)) : 0;

  return (
    <div className="border-border flex flex-col gap-2 rounded-lg border p-4">
      <div className="flex items-center gap-2">
        <Apple size={16} aria-hidden className="text-success" />
        <Text variant="heading-s">Nutrition</Text>
      </div>
      <Text variant="heading-xl" className="tabular-nums">
        {consumed}
        <span className="text-fg-subtle text-body-s"> kcal</span>
      </Text>
      <Progress value={percent} />
      <Text variant="caption" tone="subtle">
        {nutrition.caloriesRemaining} kcal · {nutrition.proteinRemaining}g protein left
      </Text>
      <div className="text-caption text-fg-subtle flex gap-3 pt-1">
        <span>P {nutrition.macroSplit.protein}%</span>
        <span>C {nutrition.macroSplit.carbs}%</span>
        <span>F {nutrition.macroSplit.fat}%</span>
      </div>
    </div>
  );
}
