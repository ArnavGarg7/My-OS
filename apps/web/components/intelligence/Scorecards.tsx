"use client";

import { Badge, Text } from "@myos/ui";
import type { Scorecard } from "@myos/core/intelligence";
import { ATTENTION_LABEL, ATTENTION_TONE } from "./intelligence-icons";

/**
 * Scorecards (Sprint 4.4). Six grouped scorecards, each headlining an owned score with its
 * contributing metrics restated below. Presentation only.
 */
export function Scorecards({ cards }: { cards: Scorecard[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {cards.map((c) => (
        <div key={c.key} className="border-border-subtle flex flex-col gap-2 rounded-md border p-3">
          <div className="flex items-center justify-between">
            <Text variant="body-m">{c.label}</Text>
            <Badge size="sm" variant={ATTENTION_TONE[c.level]}>
              {c.score}
            </Badge>
          </div>
          <div className="flex flex-col gap-0.5">
            {c.metrics.map((m) => (
              <div key={m.label} className="flex items-center justify-between">
                <Text variant="caption" tone="subtle">
                  {m.label}
                </Text>
                <Text variant="caption">{m.value}</Text>
              </div>
            ))}
          </div>
          <Text variant="caption" tone="subtle">
            {ATTENTION_LABEL[c.level]}
          </Text>
        </div>
      ))}
    </div>
  );
}
