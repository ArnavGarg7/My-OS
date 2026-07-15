"use client";

import { Target } from "lucide-react";
import { Progress, Text } from "@myos/ui";
import { DEFAULT_GOALS, type HealthSummary } from "@myos/core/health";

/** HealthGoals (Sprint 2.9): today's goal progress (water, protein, sleep). */
export function HealthGoals({ summary }: { summary: HealthSummary }) {
  const goals = [
    {
      label: "Water",
      value: summary.hydration.completionPercent,
      hint: `${summary.hydration.totalMl}/${summary.hydration.goalMl}ml`,
    },
    {
      label: "Protein",
      value: Math.min(100, Math.round((summary.nutrition.protein / DEFAULT_GOALS.proteinG) * 100)),
      hint: `${summary.nutrition.protein}/${DEFAULT_GOALS.proteinG}g`,
    },
    {
      label: "Sleep",
      value: summary.sleep
        ? Math.min(
            100,
            Math.round((summary.sleep.durationMinutes / DEFAULT_GOALS.sleepMinutes) * 100),
          )
        : 0,
      hint: summary.sleep ? `${Math.round(summary.sleep.durationMinutes / 60)}h` : "—",
    },
  ];

  return (
    <div className="border-border flex flex-col gap-3 rounded-lg border p-4">
      <div className="flex items-center gap-2">
        <Target size={16} aria-hidden className="text-fg-subtle" />
        <Text variant="heading-s">Today's Goals</Text>
      </div>
      {goals.map((g) => (
        <div key={g.label} className="flex flex-col gap-1">
          <div className="flex justify-between">
            <Text variant="caption" tone="subtle">
              {g.label}
            </Text>
            <Text variant="caption" className="tabular-nums">
              {g.hint}
            </Text>
          </div>
          <Progress value={g.value} />
        </div>
      ))}
    </div>
  );
}
