"use client";

import { Text } from "@myos/ui";
import type { BurndownPoint } from "@myos/core/project";

/**
 * BurndownChart (Sprint 2.8). A pure SVG remaining-work-over-time chart with the
 * ideal straight line for comparison. Data comes from recorded task completion.
 */
export function BurndownChart({ points }: { points: BurndownPoint[] }) {
  if (points.length < 2) {
    return (
      <Text variant="body-s" tone="subtle">
        Not enough history to chart a burndown yet.
      </Text>
    );
  }

  const width = 320;
  const height = 120;
  const pad = 8;
  const maxRemaining = Math.max(...points.map((p) => p.remaining), 1);
  const x = (i: number) => pad + (i / (points.length - 1)) * (width - pad * 2);
  const y = (v: number) => pad + (1 - v / maxRemaining) * (height - pad * 2);

  const line = (key: "remaining" | "ideal") =>
    points
      .map((p, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(p[key]).toFixed(1)}`)
      .join(" ");

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="w-full"
      role="img"
      aria-label="Burndown chart"
    >
      <path
        d={line("ideal")}
        fill="none"
        className="stroke-border"
        strokeWidth={1.5}
        strokeDasharray="4 3"
      />
      <path
        d={line("remaining")}
        fill="none"
        className="stroke-accent"
        strokeWidth={2}
        strokeLinecap="round"
      />
    </svg>
  );
}
