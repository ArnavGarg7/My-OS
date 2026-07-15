"use client";

import { TrendingUp } from "lucide-react";
import { Badge, Text } from "@myos/ui";
import type { GoalForecast as Forecast } from "@myos/core/goal";
import { FORECAST_LABEL } from "./goal-icons";

const VARIANT: Record<Forecast["status"], "success" | "warning" | "neutral"> = {
  ahead: "success",
  on_track: "success",
  behind: "warning",
  unknown: "neutral",
};

/**
 * GoalForecast (Sprint 2.12). Rule-based projection — velocity, estimated
 * completion and ahead/on-track/behind status. No ML.
 */
export function GoalForecast({ forecast }: { forecast: Forecast }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <TrendingUp size={16} aria-hidden className="text-fg-subtle" />
        <Text variant="heading-s">Forecast</Text>
        <Badge size="sm" variant={VARIANT[forecast.status]}>
          {FORECAST_LABEL[forecast.status]}
        </Badge>
      </div>
      <Text variant="caption" tone="subtle" className="tabular-nums">
        {forecast.velocityPerDay}%/day ·{" "}
        {forecast.estimatedCompletion
          ? `est. ${new Date(forecast.estimatedCompletion).toLocaleDateString()}`
          : "no estimate yet"}
      </Text>
      {forecast.status !== "unknown" && (
        <Text variant="caption" tone="subtle">
          Projected {forecast.projectedProgressAtTarget}% by target date.
        </Text>
      )}
    </div>
  );
}
