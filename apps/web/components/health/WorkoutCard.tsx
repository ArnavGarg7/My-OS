"use client";

import { Dumbbell } from "lucide-react";
import { Text } from "@myos/ui";
import type { WorkoutSummary } from "@myos/core/health";

/** Workout card (Sprint 2.9): today's sessions, minutes, calories, RPE. */
export function WorkoutCard({ workouts }: { workouts: WorkoutSummary }) {
  return (
    <div className="border-border flex flex-col gap-2 rounded-lg border p-4">
      <div className="flex items-center gap-2">
        <Dumbbell size={16} aria-hidden className="text-fg-subtle" />
        <Text variant="heading-s">Workouts</Text>
      </div>
      {workouts.count > 0 ? (
        <>
          <Text variant="heading-xl" className="tabular-nums">
            {workouts.totalMinutes}
            <span className="text-fg-subtle text-body-s"> min</span>
          </Text>
          <Text variant="caption" tone="subtle">
            {workouts.count} session{workouts.count === 1 ? "" : "s"} · {workouts.caloriesBurned}{" "}
            kcal
            {workouts.averageRpe !== null ? ` · RPE ${workouts.averageRpe}` : ""}
          </Text>
        </>
      ) : (
        <Text variant="body-s" tone="subtle">
          No workouts logged today.
        </Text>
      )}
    </div>
  );
}
