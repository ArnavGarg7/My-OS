"use client";

import { Progress, Text } from "@myos/ui";
import { goalProgress, type Goal } from "@myos/core/goal";

/**
 * GoalProgress (Sprint 2.12). A goal's derived overall progress bar + the
 * objectives/habits breakdown. Progress is always computed.
 */
export function GoalProgress({ goal }: { goal: Goal }) {
  const p = goalProgress(goal);
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <Text variant="body-s" tone="subtle">
          Overall progress
        </Text>
        <Text variant="body-s" className="tabular-nums">
          {p.overall}%
        </Text>
      </div>
      <Progress value={p.overall} />
      <Text variant="caption" tone="subtle">
        {p.completedObjectives}/{p.totalObjectives} objectives · objectives {p.objectivesPercent}% ·
        habits {p.habitsPercent}%
      </Text>
    </div>
  );
}
