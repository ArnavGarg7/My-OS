"use client";

import { Progress, Text, cn } from "@myos/ui";
import {
  DIRECTION_ICON,
  directionTone,
  formatScore,
  formatSigned,
  scoreDot,
  scoreTone,
  type Direction,
} from "./analytics-icons";

/**
 * Analytics chart primitives (Sprint 2.14). Deterministic, dependency-free
 * visualisations: a score tile, a labelled metric bar, a trend badge and an SVG
 * sparkline/bar series. Editorial — no chart-library card explosion.
 */
export function ScoreTile({ label, score }: { label: string; score: number }) {
  return (
    <div className="border-border flex flex-col gap-1 rounded-md border p-3">
      <div className="flex items-center gap-1.5">
        <span aria-hidden className={cn("size-1.5 rounded-full", scoreDot(score))} />
        <Text variant="caption" tone="subtle">
          {label}
        </Text>
      </div>
      <Text variant="heading-m" className={cn("tabular-nums", scoreTone(score))}>
        {formatScore(score)}
      </Text>
    </div>
  );
}

export function MetricBar({
  label,
  value,
  suffix,
  percent,
}: {
  label: string;
  value: string | number;
  suffix?: string;
  percent?: number;
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between gap-2">
        <Text variant="body-s" tone="subtle">
          {label}
        </Text>
        <Text variant="body-s" className="tabular-nums">
          {value}
          {suffix ? ` ${suffix}` : ""}
        </Text>
      </div>
      {typeof percent === "number" ? (
        <Progress value={Math.max(0, Math.min(100, percent))} />
      ) : null}
    </div>
  );
}

export function TrendBadge({
  direction,
  changePercent,
  upIsGood = true,
}: {
  direction: Direction;
  changePercent: number;
  upIsGood?: boolean;
}) {
  const Icon = DIRECTION_ICON[direction];
  return (
    <span
      className={cn(
        "text-caption inline-flex items-center gap-1 tabular-nums",
        directionTone(direction, upIsGood),
      )}
    >
      <Icon size={13} aria-hidden />
      {formatSigned(changePercent)}
    </span>
  );
}

/** A compact SVG bar series from `{ label, value }[]`. */
export function BarSeries({
  data,
  height = 48,
  ariaLabel = "activity chart",
}: {
  data: { label: string; value: number }[];
  height?: number;
  ariaLabel?: string;
}) {
  if (data.length === 0) {
    return (
      <Text variant="caption" tone="subtle">
        No data yet.
      </Text>
    );
  }
  const max = Math.max(1, ...data.map((d) => d.value));
  const w = 100 / data.length;
  return (
    <svg
      viewBox={`0 0 100 ${height}`}
      preserveAspectRatio="none"
      className="h-12 w-full"
      role="img"
      aria-label={ariaLabel}
    >
      {data.map((d, i) => {
        const barH = (d.value / max) * (height - 2);
        return (
          <rect
            key={i}
            x={i * w + w * 0.15}
            y={height - barH}
            width={w * 0.7}
            height={barH}
            rx={0.6}
            className="fill-accent"
          >
            <title>{`${d.label}: ${d.value}`}</title>
          </rect>
        );
      })}
    </svg>
  );
}
