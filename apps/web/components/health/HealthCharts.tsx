"use client";

import { Text } from "@myos/ui";

/**
 * HealthCharts (Sprint 2.9). A tiny, dependency-free SVG sparkline for a metric
 * series. Chart *logic* stays out of @myos/core/health — this is pure rendering.
 */
export function Sparkline({
  values,
  label,
  unit = "",
}: {
  values: number[];
  label: string;
  unit?: string;
}) {
  if (values.length < 2) {
    return (
      <Text variant="caption" tone="subtle">
        {label}: not enough data
      </Text>
    );
  }
  const width = 160;
  const height = 40;
  const pad = 3;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const span = max - min || 1;
  const x = (i: number) => pad + (i / (values.length - 1)) * (width - pad * 2);
  const y = (v: number) => pad + (1 - (v - min) / span) * (height - pad * 2);
  const d = values
    .map((v, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(v).toFixed(1)}`)
    .join(" ");

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline justify-between">
        <Text variant="caption" tone="subtle">
          {label}
        </Text>
        <Text variant="caption" className="tabular-nums">
          {values.at(-1)}
          {unit}
        </Text>
      </div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full"
        role="img"
        aria-label={`${label} trend`}
      >
        <path d={d} fill="none" className="stroke-accent" strokeWidth={2} strokeLinecap="round" />
      </svg>
    </div>
  );
}
