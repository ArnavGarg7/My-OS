"use client";

import { Dumbbell } from "lucide-react";
import { EmptyState, Text } from "@myos/ui";
import { personalRecords, type WorkoutSession } from "@myos/core/life";

/**
 * ExerciseLibrary (Sprint 4.2). Derives the exercises trained + their PRs from logged
 * workout sessions (max weight per exercise). Pure, deterministic PR tracking.
 */
export function ExerciseLibrary({ workouts }: { workouts: WorkoutSession[] }) {
  const prs = [...personalRecords(workouts).entries()].sort((a, b) => b[1] - a[1]);
  if (prs.length === 0) {
    return (
      <EmptyState
        icon={Dumbbell}
        title="No exercises yet"
        description="Log workouts to build your PR library."
      />
    );
  }
  return (
    <div className="flex flex-col gap-1">
      <Text variant="caption" tone="subtle" className="uppercase tracking-wide">
        Personal records
      </Text>
      {prs.map(([exerciseId, weight]) => (
        <div
          key={exerciseId}
          className="border-border-subtle flex items-center justify-between rounded border px-3 py-1.5"
        >
          <Text variant="body-s">{exerciseId}</Text>
          <Text variant="caption" tone="subtle">
            {weight} kg
          </Text>
        </div>
      ))}
    </div>
  );
}
