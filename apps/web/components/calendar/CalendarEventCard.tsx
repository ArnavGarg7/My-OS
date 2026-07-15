"use client";

import { Repeat, MapPin } from "lucide-react";
import { cn } from "@myos/ui";
import type { CalendarEvent } from "@myos/core/calendar";
import { STATUS_DOT } from "./calendar-icons";

function time(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

/** A single event card (Sprint 2.7). Time · title · status · location. */
export function CalendarEventCard({
  event,
  selected,
  onSelect,
}: {
  event: CalendarEvent;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        "flex w-full items-start gap-3 rounded-lg border px-3 py-2 text-left outline-none transition-colors",
        selected ? "border-accent bg-accent-muted/30" : "border-border hover:bg-elevated",
        event.status === "cancelled" ? "opacity-60" : "",
      )}
    >
      <span
        aria-hidden
        className={`mt-1.5 size-2 shrink-0 rounded-full ${STATUS_DOT[event.status]}`}
      />
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span
            className={cn(
              "text-body-m text-fg truncate font-medium",
              event.status === "cancelled" && "line-through",
            )}
          >
            {event.title}
          </span>
          {event.recurrenceParent ? (
            <Repeat size={12} aria-label="Recurring" className="text-fg-subtle shrink-0" />
          ) : null}
        </span>
        <span className="text-caption text-fg-subtle flex items-center gap-2">
          <span className="tabular-nums">
            {event.allDay ? "All day" : `${time(event.startAt)}–${time(event.endAt)}`}
          </span>
          {event.location ? (
            <span className="flex items-center gap-1">
              <MapPin size={11} aria-hidden />
              {event.location}
            </span>
          ) : null}
        </span>
      </span>
    </button>
  );
}
