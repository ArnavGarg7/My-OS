"use client";

import { Badge, TimelineItem as TimelineItemPrimitive, cn } from "@myos/ui";
import type { TimelineEvent } from "@myos/core/timeline";
import { SOURCE_COLOR, SOURCE_LABEL, clockTime, eventIcon } from "./timeline-icons";

/**
 * TimelineItem (Sprint 2.13). One event in the editorial vertical history —
 * icon, title, source, time, and an importance badge for memorable events.
 * Editorial, not a card. Clicking selects it for the inspector.
 */
export function TimelineItem({
  event,
  last,
  selected,
  onSelect,
}: {
  event: TimelineEvent;
  last?: boolean;
  selected?: boolean;
  onSelect?: (id: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect?.(event.id)}
      className={cn(
        "focus-visible:ring-ring w-full rounded-md text-left outline-none focus-visible:ring-1",
        selected && "bg-elevated",
      )}
      aria-pressed={selected}
    >
      <TimelineItemPrimitive
        icon={eventIcon(event)}
        color={SOURCE_COLOR[event.source]}
        title={event.title}
        last={last ?? false}
        meta={clockTime(event.timestamp)}
      >
        <span className="flex flex-wrap items-center gap-2">
          <span className="text-fg-subtle">{SOURCE_LABEL[event.source]}</span>
          {event.summary && event.summary !== event.title ? (
            <span className="truncate">· {event.summary}</span>
          ) : null}
          {event.importance >= 85 ? (
            <Badge size="sm" variant="accent">
              Milestone
            </Badge>
          ) : null}
        </span>
      </TimelineItemPrimitive>
    </button>
  );
}
