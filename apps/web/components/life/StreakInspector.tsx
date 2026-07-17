"use client";

import { StatBlock, Text } from "@myos/ui";
import type { Habit, StreakInfo } from "@myos/core/life";

type Streak = StreakInfo & { habitId: string };

/**
 * StreakInspector (Sprint 4.2). The derived streak detail for a selected habit — current
 * and longest streak, consistency, completion rate, missed days and recovery score. All
 * computed by the pure streak engine.
 */
export function StreakInspector({ habit, streak }: { habit: Habit | null; streak: Streak | null }) {
  if (!habit) {
    return (
      <Text variant="body-s" tone="subtle">
        Select a habit to inspect its streak.
      </Text>
    );
  }
  return (
    <div className="flex flex-col gap-3">
      <Text variant="heading-s">{habit.name}</Text>
      {streak ? (
        <div className="grid grid-cols-3 gap-3">
          <StatBlock label="Current" value={String(streak.current)} />
          <StatBlock label="Longest" value={String(streak.longest)} />
          <StatBlock label="Consistency" value={`${streak.consistency}%`} />
          <StatBlock label="Completion" value={`${streak.completionRate}%`} />
          <StatBlock label="Missed" value={String(streak.missedDays)} />
          <StatBlock label="Recovery" value={`${streak.recoveryScore}%`} />
        </div>
      ) : (
        <Text variant="caption" tone="subtle">
          No streak data yet — complete this habit to start.
        </Text>
      )}
    </div>
  );
}
