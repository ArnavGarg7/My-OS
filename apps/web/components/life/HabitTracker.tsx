"use client";

import { Check, Flame } from "lucide-react";
import { Badge, Button, EmptyState, Text } from "@myos/ui";
import type { Habit, StreakInfo } from "@myos/core/life";
import { HabitIcon } from "./life-icons";

type Streak = StreakInfo & { habitId: string };

/**
 * HabitTracker (Sprint 4.2). Lists habits with their derived streak + consistency and a
 * one-tap complete button. Streaks come from the pure streak engine.
 */
export function HabitTracker({
  habits,
  streaks,
  selectedId,
  onSelect,
  onComplete,
}: {
  habits: Habit[];
  streaks: Streak[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onComplete: (id: string) => void;
}) {
  if (habits.length === 0) {
    return (
      <EmptyState
        icon={HabitIcon}
        title="No habits yet"
        description="Add a habit to start building streaks."
      />
    );
  }
  const byId = new Map(streaks.map((s) => [s.habitId, s]));

  return (
    <ul className="flex flex-col gap-1.5">
      {habits.map((h) => {
        const s = byId.get(h.id);
        const active = h.id === selectedId;
        return (
          <li
            key={h.id}
            className={`flex items-center justify-between gap-2 rounded-md border px-3 py-2 ${
              active ? "border-accent bg-surface-raised" : "border-border-subtle"
            }`}
          >
            <button
              type="button"
              onClick={() => onSelect(h.id)}
              className="flex items-center gap-2 text-left"
            >
              <HabitIcon size={14} aria-hidden className="text-fg-subtle" />
              <span className="flex flex-col">
                <Text variant="body-s">{h.name}</Text>
                <span className="flex items-center gap-1.5">
                  {s && s.current > 0 ? (
                    <Badge size="sm" variant="warning">
                      <Flame size={11} aria-hidden /> {s.current}
                    </Badge>
                  ) : null}
                  {s ? (
                    <Text variant="caption" tone="subtle">
                      {s.consistency}% consistent
                    </Text>
                  ) : null}
                  {s?.atRisk ? (
                    <Badge size="sm" variant="danger">
                      At risk
                    </Badge>
                  ) : null}
                </span>
              </span>
            </button>
            <Button size="sm" variant="secondary" onClick={() => onComplete(h.id)}>
              <Check size={13} aria-hidden /> Done
            </Button>
          </li>
        );
      })}
    </ul>
  );
}
