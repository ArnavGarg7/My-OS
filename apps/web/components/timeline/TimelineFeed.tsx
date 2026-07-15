"use client";

import { Clock } from "lucide-react";
import { EmptyState } from "@myos/ui";
import type { TimelineEvent, TimelineGroup as Group } from "@myos/core/timeline";
import { TimelineGroup } from "./TimelineGroup";
import { TimelineItem } from "./TimelineItem";

/**
 * TimelineFeed (Sprint 2.13). The chronological history. Renders grouped buckets
 * normally, or a flat list of search results. Empty state when nothing matches.
 */
export function TimelineFeed({
  groups,
  events,
  searching,
  selectedId,
  onSelect,
}: {
  groups: Group[];
  events: TimelineEvent[];
  searching: boolean;
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  if (searching) {
    if (events.length === 0) {
      return (
        <EmptyState icon={Clock} title="No matching events" description="Try another search." />
      );
    }
    return (
      <div className="flex flex-col">
        {events.map((event, i) => (
          <TimelineItem
            key={event.id}
            event={event}
            last={i === events.length - 1}
            selected={event.id === selectedId}
            onSelect={onSelect}
          />
        ))}
      </div>
    );
  }

  if (groups.length === 0) {
    return (
      <EmptyState
        icon={Clock}
        title="Your history starts here"
        description="As you work across My OS, every meaningful event is recorded on this timeline."
      />
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {groups.map((group) => (
        <TimelineGroup key={group.key} group={group} selectedId={selectedId} onSelect={onSelect} />
      ))}
    </div>
  );
}
