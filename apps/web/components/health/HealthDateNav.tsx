"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button, Text } from "@myos/ui";

/**
 * HealthDateNav: navigate between days to view historical health data.
 * Shows the selected date and prev/next arrows. Future dates are disabled.
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
        weekday: "short",
        month: "short",
        day: "numeric",
      });

  return (
    <div className="flex items-center gap-2">
      <Button variant="ghost" size="sm" onClick={() => shift(-1)} aria-label="Previous day">
        <ChevronLeft size={16} />
      </Button>
      <button
        className="min-w-[120px] text-center"
        onClick={() => onChange(today)}
        title="Go to today"
        aria-label={isToday ? "Today" : `Viewing ${date}, click to go to today`}
      >
        <Text variant="heading-s">{label}</Text>
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
