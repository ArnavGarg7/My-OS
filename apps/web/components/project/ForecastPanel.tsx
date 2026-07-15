"use client";

import { TrendingUp } from "lucide-react";
import { Badge, Text } from "@myos/ui";
import type { Forecast } from "@myos/core/project";

/**
 * ForecastPanel (Sprint 2.8). Presents the rule-based forecast — velocity,
 * remaining work, estimated completion, confidence and predicted delay. No AI.
 */
export function ForecastPanel({ forecast }: { forecast: Forecast }) {
  const rows: { label: string; value: string }[] = [
    { label: "Velocity", value: `${forecast.velocityPerDay}/day` },
    { label: "Remaining", value: `${forecast.remainingTasks} tasks` },
    {
      label: "Est. completion",
      value: forecast.estimatedCompletion ?? "Unknown",
    },
    { label: "Confidence", value: `${forecast.confidence}%` },
  ];

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <TrendingUp size={16} aria-hidden className="text-fg-subtle" />
        <Text variant="heading-s">Forecast</Text>
        <Badge size="sm" variant={forecast.onTrack ? "success" : "warning"}>
          {forecast.onTrack ? "On track" : `+${forecast.predictedDelayDays}d delay`}
        </Badge>
      </div>
      <dl className="grid grid-cols-2 gap-2">
        {rows.map((r) => (
          <div key={r.label} className="border-border rounded-md border p-2">
            <dt>
              <Text variant="caption" tone="subtle">
                {r.label}
              </Text>
            </dt>
            <dd>
              <Text variant="body-s" className="tabular-nums">
                {r.value}
              </Text>
            </dd>
          </div>
        ))}
      </dl>
      {!forecast.onTrack && forecast.bufferDays > 0 && (
        <Text variant="caption" tone="subtle">
          Reserve ~{forecast.bufferDays} buffer day{forecast.bufferDays === 1 ? "" : "s"}.
        </Text>
      )}
    </div>
  );
}
