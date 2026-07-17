"use client";

import { Text } from "@myos/ui";
import type { StreakInfo } from "@myos/core/life";

type Streak = StreakInfo & { habitId: string };

/**
 * HabitCalendar (Sprint 4.2). A compact consistency heatmap across all habits — each
 * habit's 30-day consistency shown as a filled bar. Derived, deterministic.
 */
export function HabitCalendar({
  habits,
  streaks,
}: {
  habits: { id: string; name: string }[];
  streaks: Streak[];
}) {
  const byId = new Map(streaks.map((s) => [s.habitId, s]));
  if (habits.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      <Text variant="caption" tone="subtle" className="uppercase tracking-wide">
        30-day consistency
      </Text>
      {habits.map((h) => {
        const pct = byId.get(h.id)?.consistency ?? 0;
        return (
          <div key={h.id} className="flex items-center gap-2">
            <Text variant="caption" className="w-28 truncate">
              {h.name}
            </Text>
            <div className="bg-surface-raised h-2 flex-1 overflow-hidden rounded-full">
              <div
                className="bg-success h-full rounded-full"
                style={{ width: `${pct}%` }}
                aria-label={`${pct}% consistent`}
              />
            </div>
            <Text variant="caption" tone="subtle" className="w-10 text-right">
              {pct}%
            </Text>
          </div>
        );
      })}
    </div>
  );
}
