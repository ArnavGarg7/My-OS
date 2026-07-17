"use client";

import { Badge, Text } from "@myos/ui";
import type { LifeAreaView } from "@myos/core/intelligence";
import { ATTENTION_TONE, TREND_GLYPH } from "./intelligence-icons";

/**
 * LifeAreas (Sprint 4.4). The eight-area rollup as a list, each with its derived score, trend
 * glyph and signed velocity. Scores are read from the owning modules; nothing is recomputed.
 */
export function LifeAreas({ areas }: { areas: LifeAreaView[] }) {
  return (
    <div className="flex flex-col gap-1">
      {areas.map((a) => (
        <div key={a.area} className="flex items-center gap-2">
          <span className="w-32 shrink-0">
            <Text variant="body-s">{a.label}</Text>
          </span>
          <div className="bg-surface-subtle h-2 flex-1 overflow-hidden rounded-full">
            <div className="bg-accent h-full rounded-full" style={{ width: `${a.score}%` }} />
          </div>
          <span className="w-20 shrink-0 text-right">
            <Text variant="caption" tone="subtle">
              {a.score} {TREND_GLYPH[a.trend]}
              {a.velocity !== 0 ? ` ${a.velocity > 0 ? "+" : ""}${a.velocity}` : ""}
            </Text>
          </span>
          <Badge size="sm" variant={ATTENTION_TONE[a.level]}>
            {a.trend}
          </Badge>
        </div>
      ))}
    </div>
  );
}
