"use client";

import { Badge, Text } from "@myos/ui";
import { byQuadrant, type PriorityItem, type Quadrant } from "@myos/core/intelligence";
import { ATTENTION_TONE } from "./intelligence-icons";

const QUADRANTS: { key: Quadrant; label: string }[] = [
  { key: "do_now", label: "Do now" },
  { key: "schedule", label: "Schedule" },
  { key: "delegate", label: "Quick wins" },
  { key: "watch", label: "Watch" },
];

/**
 * PriorityMatrix (Sprint 4.4). The attention items arranged into an importance × urgency grid.
 * Both axes are derived deterministically from the attention band — no new judgement.
 */
export function PriorityMatrix({ items }: { items: PriorityItem[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {QUADRANTS.map((q) => {
        const cell = byQuadrant(items, q.key);
        return (
          <div
            key={q.key}
            className="border-border-subtle flex flex-col gap-1 rounded-md border p-3"
          >
            <Text variant="caption" tone="subtle">
              {q.label.toUpperCase()}
            </Text>
            {cell.length === 0 ? (
              <Text variant="caption" tone="subtle">
                —
              </Text>
            ) : (
              cell.map((p) => (
                <div key={p.item.id} className="flex items-center justify-between gap-2">
                  <Text variant="caption">{p.item.title}</Text>
                  <Badge size="sm" variant={ATTENTION_TONE[p.item.level]}>
                    {p.item.area}
                  </Badge>
                </div>
              ))
            )}
          </div>
        );
      })}
    </div>
  );
}
