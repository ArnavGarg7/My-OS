"use client";

import { Text } from "@myos/ui";
import type { HydrationLog, NutritionLog, Workout } from "@myos/core/health";

interface Entry {
  time: string;
  label: string;
}

/** HealthTimeline (Sprint 2.9): today's logged events in chronological order. */
export function HealthTimeline({
  hydration,
  nutrition,
  workouts,
}: {
  hydration: HydrationLog[];
  nutrition: NutritionLog[];
  workouts: Workout[];
}) {
  const entries: Entry[] = [
    ...hydration.map((h) => ({ time: h.time, label: `Water · ${h.amountMl}ml` })),
    ...nutrition.map((n) => ({ time: n.loggedAt, label: `${n.meal} · ${n.calories} kcal` })),
    ...workouts.map((w) => ({ time: w.startedAt, label: `${w.type} · ${w.durationMinutes}m` })),
  ].sort((a, b) => a.time.localeCompare(b.time));

  if (entries.length === 0) {
    return (
      <Text variant="body-s" tone="subtle">
        Nothing logged yet today.
      </Text>
    );
  }

  return (
    <ol className="border-border flex flex-col gap-2 border-l pl-4">
      {entries.map((e, i) => (
        <li key={i} className="relative">
          <span
            className="bg-accent absolute -left-[1.3rem] top-1.5 size-2 rounded-full"
            aria-hidden
          />
          <Text variant="body-s">{e.label}</Text>
          <Text variant="caption" tone="subtle">
            {new Date(e.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </Text>
        </li>
      ))}
    </ol>
  );
}
