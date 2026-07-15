"use client";

import { useMemo } from "react";
import { Text, cn } from "@myos/ui";
import { dayOf, type TimelineEvent } from "@myos/core/timeline";

/**
 * TimelineMiniCalendar (Sprint 2.13). A compact 14-day activity strip — one cell
 * per day, shaded by event count. Deterministic client-side rollup of the loaded
 * feed. Clicking a day filters the search box to that date.
 */
export function TimelineMiniCalendar({
  events,
  onPickDate,
}: {
  events: TimelineEvent[];
  onPickDate?: (date: string) => void;
}) {
  const cells = useMemo(() => {
    const counts = new Map<string, number>();
    for (const e of events)
      counts.set(dayOf(e.timestamp), (counts.get(dayOf(e.timestamp)) ?? 0) + 1);
    const out: { date: string; count: number }[] = [];
    const today = new Date();
    for (let i = 13; i >= 0; i--) {
      const d = new Date(today.getTime() - i * 86_400_000).toISOString().slice(0, 10);
      out.push({ date: d, count: counts.get(d) ?? 0 });
    }
    return out;
  }, [events]);

  const shade = (count: number) => {
    if (count === 0) return "bg-elevated";
    if (count < 3) return "bg-accent/30";
    if (count < 6) return "bg-accent/60";
    return "bg-accent";
  };

  return (
    <div className="flex flex-col gap-1.5">
      <Text variant="label" tone="subtle">
        Last 14 days
      </Text>
      <div className="flex gap-1">
        {cells.map((c) => (
          <button
            key={c.date}
            type="button"
            title={`${c.date}: ${c.count} events`}
            aria-label={`${c.date}: ${c.count} events`}
            onClick={() => onPickDate?.(c.date)}
            className={cn("size-4 rounded-sm", shade(c.count))}
          />
        ))}
      </div>
    </div>
  );
}
