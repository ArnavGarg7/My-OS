"use client";

import { useMemo } from "react";
import { cn } from "@myos/ui";
import { eventsOnDay, type CalendarEvent } from "@myos/core/calendar";

/**
 * Month view (Sprint 2.7). A month grid for navigation + inspection (not
 * drag-and-drop editing). Days with events show a dot count; clicking a day
 * jumps to it.
 */
export function CalendarMonthView({
  events,
  dateKey,
  onPickDay,
}: {
  events: CalendarEvent[];
  dateKey: string;
  onPickDay: (dateKey: string) => void;
}) {
  const { cells, todayKey } = useMemo(() => {
    const anchor = new Date(`${dateKey}T00:00:00`);
    const year = anchor.getFullYear();
    const month = anchor.getMonth();
    const first = new Date(year, month, 1);
    const startPad = first.getDay();
    const days = new Date(year, month + 1, 0).getDate();
    const p = (n: number) => String(n).padStart(2, "0");
    const out: (string | null)[] = [];
    for (let i = 0; i < startPad; i++) out.push(null);
    for (let d = 1; d <= days; d++) out.push(`${year}-${p(month + 1)}-${p(d)}`);
    return { cells: out, todayKey: dateKey };
  }, [dateKey]);

  return (
    <div className="p-4">
      <div className="grid grid-cols-7 gap-1 text-center">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <span key={d} className="text-caption text-fg-subtle py-1">
            {d}
          </span>
        ))}
        {cells.map((key, i) => {
          if (!key) return <span key={i} />;
          const count = eventsOnDay(events, key).length;
          const day = Number(key.slice(-2));
          return (
            <button
              key={key}
              type="button"
              onClick={() => onPickDay(key)}
              className={cn(
                "border-border hover:bg-elevated flex min-h-16 flex-col items-center gap-1 rounded-md border p-1 outline-none",
                key === todayKey ? "border-accent" : "",
              )}
            >
              <span className="text-body-s text-fg-muted tabular-nums">{day}</span>
              {count > 0 ? (
                <span className="bg-accent text-inverted text-caption rounded-full px-1.5">
                  {count}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
