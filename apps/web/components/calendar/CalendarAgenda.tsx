"use client";

import { CalendarDays } from "lucide-react";
import { EmptyState } from "@myos/ui";
import { sortEvents, type CalendarEvent } from "@myos/core/calendar";
import { CalendarEventCard } from "./CalendarEventCard";

function dayLabel(iso: string): string {
  return new Date(iso).toLocaleDateString([], { weekday: "long", month: "short", day: "numeric" });
}

/**
 * Agenda view (Sprint 2.7). A chronological reading list of upcoming events,
 * grouped by day. The default, editorial calendar view.
 */
export function CalendarAgenda({
  events,
  selectedId,
  onSelect,
}: {
  events: CalendarEvent[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  if (events.length === 0) {
    return (
      <div className="p-10">
        <EmptyState
          icon={CalendarDays}
          title="Nothing scheduled"
          description="No events in this range. Create one or sync a calendar."
        />
      </div>
    );
  }

  const groups = new Map<string, CalendarEvent[]>();
  for (const e of sortEvents(events)) {
    const key = e.startAt.slice(0, 10);
    groups.set(key, [...(groups.get(key) ?? []), e]);
  }

  return (
    <div className="flex flex-col gap-5 p-4">
      {[...groups.entries()].map(([key, dayEvents]) => (
        <section key={key} className="flex flex-col gap-2">
          <h3 className="text-label text-fg-subtle">{dayLabel(dayEvents[0]!.startAt)}</h3>
          <div className="flex flex-col gap-1.5">
            {dayEvents.map((e) => (
              <CalendarEventCard
                key={e.id}
                event={e}
                selected={e.id === selectedId}
                onSelect={() => onSelect(e.id)}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
