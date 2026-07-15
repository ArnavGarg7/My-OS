"use client";

import { useMemo } from "react";
import { cn } from "@myos/ui";
import { eventsOnDay, type CalendarEvent } from "@myos/core/calendar";
import { STATUS_DOT } from "./calendar-icons";

function time(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

/**
 * Week view (Sprint 2.7). Seven day columns with their events. Presentational.
 */
export function CalendarWeekView({
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
  const days = useMemo(() => {
    const anchor = new Date(`${dateKey}T00:00:00`);
    const start = new Date(anchor);
    start.setDate(start.getDate() - start.getDay());
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start.getTime() + i * 86_400_000);
      const p = (n: number) => String(n).padStart(2, "0");
      return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
    });
  }, [dateKey]);

  return (
    <div className="grid grid-cols-7 gap-2 p-4" role="grid">
      {days.map((key) => {
        const dayEvents = eventsOnDay(events, key);
        const d = new Date(`${key}T00:00:00`);
        return (
          <div
            key={key}
            className="border-border flex min-h-24 flex-col gap-1 rounded-md border p-1.5"
            role="gridcell"
          >
            <div className="text-caption text-fg-subtle text-center">
              {d.toLocaleDateString([], { weekday: "short" })} {d.getDate()}
            </div>
            {dayEvents.map((e) => (
              <button
                key={e.id}
                type="button"
                onClick={() => onSelect(e.id)}
                className={cn(
                  "flex items-center gap-1 rounded px-1.5 py-0.5 text-left outline-none",
                  e.id === selectedId ? "bg-accent-muted/40" : "hover:bg-elevated",
                )}
              >
                <span
                  aria-hidden
                  className={`size-1.5 shrink-0 rounded-full ${STATUS_DOT[e.status]}`}
                />
                <span className="text-caption text-fg-muted truncate">
                  {e.allDay ? "" : `${time(e.startAt)} `}
                  {e.title}
                </span>
              </button>
            ))}
          </div>
        );
      })}
    </div>
  );
}
