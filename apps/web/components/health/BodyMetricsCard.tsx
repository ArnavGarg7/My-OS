"use client";

import { Scale } from "lucide-react";
import { Text } from "@myos/ui";
import { weightTrend, type BodyMeasurement } from "@myos/core/health";

/** Body metrics card (Sprint 2.9): latest weight + trend. */
export function BodyMetricsCard({ measurements }: { measurements: BodyMeasurement[] }) {
  const trend = weightTrend(measurements);
  const arrow = trend.direction === "up" ? "↑" : trend.direction === "down" ? "↓" : "→";

  return (
    <div className="border-border flex flex-col gap-2 rounded-lg border p-4">
      <div className="flex items-center gap-2">
        <Scale size={16} aria-hidden className="text-fg-subtle" />
        <Text variant="heading-s">Body</Text>
      </div>
      {trend.latest !== null ? (
        <>
          <Text variant="heading-xl" className="tabular-nums">
            {trend.latest}
            <span className="text-fg-subtle text-body-s"> kg</span>
          </Text>
          <Text variant="caption" tone="subtle">
            {arrow} {trend.change !== null ? `${Math.abs(trend.change)}kg` : "—"} · avg{" "}
            {trend.average}kg
          </Text>
        </>
      ) : (
        <Text variant="body-s" tone="subtle">
          No measurements yet.
        </Text>
      )}
    </div>
  );
}
