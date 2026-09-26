"use client";

import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { Button } from "@myos/ui";

/**
 * HealthDateNav: prominent full-width date banner at the top of the Health page.
 * Shows exactly which day the data belongs to. Prev/next arrows navigate days;
 * clicking the date label jumps back to today. Future dates are disabled.
 */
export function HealthDateNav({
  date,
  onChange,
}: {
  date: string; // YYYY-MM-DD
  onChange: (date: string) => void;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const isToday = date === today;

  const shift = (days: number) => {
    const d = new Date(`${date}T12:00:00Z`);
    d.setUTCDate(d.getUTCDate() + days);
    onChange(d.toISOString().slice(0, 10));
  };

  const label = isToday
    ? "Today"
    : new Date(`${date}T12:00:00Z`).toLocaleDateString(undefined, {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      });

  return (
    <div
      className={[
        "flex w-full items-center justify-between rounded-lg px-3 py-2",
        isToday
          ? "border border-[hsl(var(--border))] bg-[hsl(var(--surface-2))]"
          : "border border-[hsl(var(--accent)/0.4)] bg-[hsl(var(--accent)/0.12)]",
      ].join(" ")}
    >
      <Button variant="ghost" size="sm" onClick={() => shift(-1)} aria-label="Previous day">
        <ChevronLeft size={16} />
      </Button>

      <button
        className="flex flex-1 items-center justify-center gap-2"
        onClick={() => !isToday && onChange(today)}
        title={isToday ? "Viewing today" : "Click to go back to today"}
        aria-label={isToday ? "Today" : `Viewing ${date} — click to go to today`}
        style={{ cursor: isToday ? "default" : "pointer" }}
      >
        <CalendarDays size={14} className={isToday ? "opacity-40" : "text-[hsl(var(--accent))]"} />
        <span
          className={[
            "text-sm font-semibold tracking-tight",
            isToday ? "opacity-70" : "text-[hsl(var(--accent))]",
          ].join(" ")}
        >
          {label}
        </span>
        {!isToday && <span className="ml-1 text-xs opacity-50">(tap to go to today)</span>}
      </button>

      <Button
        variant="ghost"
        size="sm"
        onClick={() => shift(1)}
        disabled={isToday}
        aria-label="Next day"
      >
        <ChevronRight size={16} />
      </Button>
    </div>
  );
}
