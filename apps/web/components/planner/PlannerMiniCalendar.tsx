"use client";

import { useMemo } from "react";
import { cn } from "@myos/ui";

/**
 * Mini month calendar (Sprint 2.6). Today is highlighted. The Planner is
 * single-day, so this is an orientation aid (multi-day arrives with Calendar).
 */
export function PlannerMiniCalendar({ date }: { date?: string | undefined }) {
  const { cells, monthLabel, todayKey } = useMemo(() => {
    const base = date ? new Date(`${date}T00:00:00`) : new Date();
    const year = base.getFullYear();
    const month = base.getMonth();
    const first = new Date(year, month, 1);
    const startPad = first.getDay();
    const days = new Date(year, month + 1, 0).getDate();
    const out: (number | null)[] = [];
    for (let i = 0; i < startPad; i++) out.push(null);
    for (let d = 1; d <= days; d++) out.push(d);
    return {
      cells: out,
      monthLabel: base.toLocaleDateString([], { month: "long", year: "numeric" }),
      todayKey: base.getDate(),
    };
  }, [date]);

  return (
    <div className="flex flex-col gap-1.5">
      <div className="text-label text-fg-subtle">{monthLabel}</div>
      <div className="grid grid-cols-7 gap-0.5 text-center">
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
          <span key={i} className="text-caption text-fg-subtle">
            {d}
          </span>
        ))}
        {cells.map((d, i) => (
          <span
            key={i}
            className={cn(
              "text-caption flex h-6 items-center justify-center rounded tabular-nums",
              d === null ? "" : "text-fg-muted",
              d === todayKey ? "bg-accent text-inverted font-medium" : "",
            )}
          >
            {d ?? ""}
          </span>
        ))}
      </div>
    </div>
  );
}
