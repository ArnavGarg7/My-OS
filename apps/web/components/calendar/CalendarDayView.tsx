"use client";

import { useMemo } from "react";
import { eventsOnDay, sortEvents, type CalendarEvent } from "@myos/core/calendar";
import { CalendarEventCard } from "./CalendarEventCard";

/**
 * Day view (Sprint 2.7). A vertical hour-by-hour timeline for the selected day.
 */
export function CalendarDayView({
  events,
  dateKey,
  selectedId,
  onSelect,
}: {
  events: CalendarEvent[];
  dateKey: string;
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const dayEvents = useMemo(() => sortEvents(eventsOnDay(events, dateKey)), [events, dateKey]);
  const startHour = dayEvents.length ? new Date(dayEvents[0]!.startAt).getHours() : 8;
  const endHour = dayEvents.length
    ? new Date(dayEvents[dayEvents.length - 1]!.startAt).getHours() + 1
    : 18;
  const hours = Array.from(
    { length: Math.max(1, endHour - startHour + 1) },
    (_, i) => startHour + i,
  );

  return (
    <div className="flex flex-col gap-1 p-4">
      {hours.map((h) => {
        const inHour = dayEvents.filter((e) => new Date(e.startAt).getHours() === h);
        return (
          <div key={h} className="flex gap-3 py-1">
            <div className="text-caption text-fg-subtle w-14 shrink-0 pt-2 text-right tabular-nums">
              {`${h % 12 === 0 ? 12 : h % 12} ${h < 12 ? "AM" : "PM"}`}
            </div>
            <div className="border-border flex flex-1 flex-col gap-1.5 border-l pl-3">
              {inHour.length === 0 ? (
                <div className="h-6" aria-hidden />
              ) : (
                inHour.map((e) => (
                  <CalendarEventCard
                    key={e.id}
                    event={e}
                    selected={e.id === selectedId}
                    onSelect={() => onSelect(e.id)}
                  />
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
