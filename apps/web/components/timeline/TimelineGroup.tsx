"use client";

import { Text } from "@myos/ui";
import type { TimelineGroup as Group } from "@myos/core/timeline";
import { TimelineItem } from "./TimelineItem";

/**
 * TimelineGroup (Sprint 2.13). A labelled bucket (day/week/month/…) with its
 * events rendered as an editorial vertical list.
 */
export function TimelineGroup({
  group,
  selectedId,
  onSelect,
}: {
  group: Group;
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <section className="flex flex-col gap-2">
      <div className="bg-base/80 sticky top-0 z-10 flex items-baseline justify-between py-1 backdrop-blur">
        <Text variant="label" tone="subtle">
          {group.label}
        </Text>
        <Text variant="caption" tone="subtle">
          {group.count} {group.count === 1 ? "event" : "events"}
        </Text>
      </div>
      <div className="flex flex-col">
        {group.events.map((event, i) => (
          <TimelineItem
            key={event.id}
            event={event}
            last={i === group.events.length - 1}
            selected={event.id === selectedId}
            onSelect={onSelect}
          />
        ))}
      </div>
    </section>
  );
}
