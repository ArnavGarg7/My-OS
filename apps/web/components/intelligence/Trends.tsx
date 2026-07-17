"use client";

import { Badge, Text } from "@myos/ui";
import type { TrendView } from "@myos/core/intelligence";
import { TREND_GLYPH, TREND_TONE } from "./intelligence-icons";

/**
 * Trends (Sprint 4.4). Named current-vs-previous trajectories. On a fresh install previous is
 * null and everything reads flat — honest, rather than inventing movement.
 */
export function Trends({ trends }: { trends: TrendView[] }) {
  return (
    <div className="flex flex-col gap-1">
      {trends.map((t) => (
        <div key={t.key} className="flex items-center justify-between">
          <Text variant="body-s">{t.label}</Text>
          <span className="inline-flex items-center gap-2">
            <Text variant="caption" tone="subtle">
              {t.current}
              {t.previous !== null ? ` (was ${t.previous})` : ""}
            </Text>
            <Badge size="sm" variant={TREND_TONE[t.direction]}>
              {TREND_GLYPH[t.direction]} {t.delta > 0 ? "+" : ""}
              {t.delta}
            </Badge>
          </span>
        </div>
      ))}
    </div>
  );
}
