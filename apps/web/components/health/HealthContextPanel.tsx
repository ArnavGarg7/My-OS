"use client";

import { Dumbbell } from "lucide-react";
import { Text } from "@myos/ui";
import { trpc } from "@/lib/trpc/client";
import { HealthInspector } from "./HealthInspector";

/**
 * Health context panel (Sprint 2.9). Route-aware right-panel content: readiness,
 * today's water / calories / protein, sleep, recovery and the next workout.
 */
export function HealthContextPanel() {
  const summary = trpc.health.summary.useQuery({});
  const signals = trpc.health.signals.useQuery({});

  if (!summary.data) {
    return (
      <div className="flex h-full items-center justify-center p-6 text-center">
        <Text variant="body-s" tone="subtle">
          Log sleep, water or a workout to see your readiness here.
        </Text>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <HealthInspector summary={summary.data} />
      {signals.data?.nextWorkoutType ? (
        <div className="flex items-center gap-2">
          <Dumbbell size={14} aria-hidden className="text-fg-subtle" />
          <Text variant="body-s" tone="subtle">
            Recent: {signals.data.nextWorkoutType}
          </Text>
        </div>
      ) : null}
    </div>
  );
}
