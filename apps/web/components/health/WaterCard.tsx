"use client";

import { Droplet, Plus } from "lucide-react";
import { Button, Progress, Text } from "@myos/ui";
import type { HydrationSummary } from "@myos/core/health";

/** Water card (Sprint 2.9): intake vs goal + quick-add glasses. */
export function WaterCard({
  hydration,
  onLog,
}: {
  hydration: HydrationSummary;
  onLog?: (ml: number) => void;
}) {
  return (
    <div className="border-border flex flex-col gap-2 rounded-lg border p-4">
      <div className="flex items-center gap-2">
        <Droplet size={16} aria-hidden className="text-info" />
        <Text variant="heading-s">Water</Text>
      </div>
      <Text variant="heading-xl" className="tabular-nums">
        {(hydration.totalMl / 1000).toFixed(1)}
        <span className="text-fg-subtle text-body-s">
          {" "}
          / {(hydration.goalMl / 1000).toFixed(1)}L
        </span>
      </Text>
      <Progress value={hydration.completionPercent} />
      <Text variant="caption" tone="subtle">
        {hydration.remainingMl > 0 ? `${hydration.remainingMl}ml to go` : "Goal reached 🎉"}
      </Text>
      {onLog && (
        <div className="flex gap-1.5 pt-1">
          {[250, 500, 750].map((ml) => (
            <Button key={ml} size="sm" variant="secondary" onClick={() => onLog(ml)}>
              <Plus size={12} aria-hidden />
              {ml}ml
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}
