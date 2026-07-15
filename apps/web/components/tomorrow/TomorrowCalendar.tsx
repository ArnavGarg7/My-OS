"use client";

import { CalendarOff } from "lucide-react";
import { Badge, EmptyState, Text } from "@myos/ui";
import type { CalendarMerge } from "@myos/core/tomorrow";
import { eventTime, minutesLabel } from "./tomorrow-icons";

/**
 * TomorrowCalendar (Sprint 3.1). Step 4 — a read-only mirror of tomorrow's
 * events. Tomorrow Studio never edits the calendar.
 */
export function TomorrowCalendar({ merge }: { merge: CalendarMerge }) {
  if (merge.events.length === 0) {
    return (
      <EmptyState
        icon={CalendarOff}
        title="A clear day"
        description="No events scheduled for tomorrow."
      />
    );
  }
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <Text variant="body-s">
          {merge.meetingCount} meeting{merge.meetingCount === 1 ? "" : "s"} ·{" "}
          {minutesLabel(merge.meetingMinutes)}
        </Text>
        {merge.meetingHeavy ? (
          <Badge size="sm" variant="warning">
            Meeting-heavy
          </Badge>
        ) : null}
      </div>
      <ul className="flex flex-col gap-1.5">
        {merge.events.map((e) => (
          <li key={e.id} className="border-border flex items-center gap-3 rounded-md border p-2.5">
            <span className="text-fg-subtle text-caption w-24 shrink-0 tabular-nums">
              {eventTime(e.start)}–{eventTime(e.end)}
            </span>
            <Text variant="body-s" className="min-w-0 flex-1 truncate">
              {e.title}
            </Text>
            <Badge size="sm" variant="neutral" className="capitalize">
              {e.kind}
            </Badge>
          </li>
        ))}
      </ul>
      {merge.freeWindows.length > 0 ? (
        <Text variant="caption" tone="subtle">
          {merge.freeWindows.length} free window{merge.freeWindows.length === 1 ? "" : "s"} for
          focus.
        </Text>
      ) : null}
    </div>
  );
}
