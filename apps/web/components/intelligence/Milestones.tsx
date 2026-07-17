"use client";

import { Badge, EmptyState, Text } from "@myos/ui";
import type { MilestoneView } from "@myos/core/intelligence";
import { MilestoneIcon } from "./intelligence-icons";

/**
 * Milestones (Sprint 4.4). Dated milestones rolled up from owning modules; status is derived
 * from the date. Completed sink to the bottom.
 */
export function Milestones({ milestones }: { milestones: MilestoneView[] }) {
  if (milestones.length === 0) {
    return (
      <EmptyState
        icon={MilestoneIcon}
        title="No milestones yet"
        description="Give a goal a target date and it will appear here."
      />
    );
  }
  return (
    <div className="flex flex-col gap-1">
      {milestones.map((m) => (
        <div
          key={m.id}
          className="border-border-subtle flex items-center justify-between rounded-md border px-3 py-2"
        >
          <span className="flex flex-col">
            <Text variant="body-s">{m.title}</Text>
            <Text variant="caption" tone="subtle">
              {m.source} · {m.date}
            </Text>
          </span>
          <Badge
            size="sm"
            variant={
              m.status === "overdue" ? "danger" : m.status === "completed" ? "success" : "neutral"
            }
          >
            {m.status}
          </Badge>
        </div>
      ))}
    </div>
  );
}
