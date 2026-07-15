"use client";

import { Flame } from "lucide-react";
import { EmptyState } from "@myos/ui";
import type { Habit } from "@myos/core/goal";
import { HabitCard } from "./HabitCard";

/**
 * HabitTracker (Sprint 2.12). The list of active habits with a complete action.
 */
export function HabitTracker({
  habits,
  onComplete,
}: {
  habits: Habit[];
  onComplete?: (id: string) => void;
}) {
  const active = habits.filter((h) => h.active);
  if (active.length === 0) {
    return (
      <EmptyState
        icon={Flame}
        title="No habits yet"
        description="Add a habit to build the recurring behaviours that advance your goals."
      />
    );
  }
  return (
    <div className="flex flex-col gap-2">
      {active.map((habit) => (
        <HabitCard key={habit.id} habit={habit} onComplete={onComplete} />
      ))}
    </div>
  );
}
