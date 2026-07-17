"use client";

import { Badge, Text } from "@myos/ui";
import type { AttentionItem } from "@myos/core/intelligence";
import { EmptyState } from "@myos/ui";
import { ATTENTION_LABEL, ATTENTION_TONE, AttentionIcon } from "./intelligence-icons";

/**
 * AttentionPanel (Sprint 4.4). The deterministic "what deserves attention" list, worst-first.
 * Every item shows the reason that surfaced it — the panel is fully explainable.
 */
export function AttentionPanel({ items }: { items: AttentionItem[] }) {
  if (items.length === 0) {
    return (
      <EmptyState
        icon={AttentionIcon}
        title="Nothing needs attention"
        description="Every life area is stable or better right now."
      />
    );
  }
  return (
    <div className="flex flex-col gap-1">
      {items.map((item) => (
        <div
          key={item.id}
          className="border-border-subtle flex items-start justify-between gap-3 rounded-md border px-3 py-2"
        >
          <span className="flex flex-col">
            <Text variant="body-s">{item.title}</Text>
            <Text variant="caption" tone="subtle">
              {item.reason}
            </Text>
          </span>
          <Badge size="sm" variant={ATTENTION_TONE[item.level]}>
            {ATTENTION_LABEL[item.level]}
          </Badge>
        </div>
      ))}
    </div>
  );
}
