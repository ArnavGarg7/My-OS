"use client";

import type { UseLife } from "./use-life";
import { HabitEditor } from "./HabitEditor";
import { HabitTracker } from "./HabitTracker";
import { StreakInspector } from "./StreakInspector";
import { HabitCalendar } from "./HabitCalendar";

/**
 * HabitsPage (Sprint 4.2). The habits surface — add, track, inspect streaks and see a
 * 30-day consistency heatmap. Composes the pure habit components.
 */
export function HabitsPage({ life }: { life: UseLife }) {
  const selectedStreak = life.streaks.find((s) => s.habitId === life.selectedHabitId) ?? null;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="flex flex-col gap-4">
        <HabitEditor onCreate={life.createHabit} />
        <HabitTracker
          habits={life.habits}
          streaks={life.streaks}
          selectedId={life.selectedHabitId}
          onSelect={life.setSelectedHabitId}
          onComplete={life.completeHabit}
        />
      </div>
      <div className="flex flex-col gap-6">
        <StreakInspector habit={life.selectedHabit} streak={selectedStreak} />
        <HabitCalendar habits={life.habits} streaks={life.streaks} />
      </div>
    </div>
  );
}
