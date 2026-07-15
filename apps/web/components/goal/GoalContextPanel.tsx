"use client";

import { Target } from "lucide-react";
import { Text } from "@myos/ui";
import { useGoal } from "./use-goal";
import { GoalProgress } from "./GoalProgress";
import { GoalForecast } from "./GoalForecast";
import { HabitTracker } from "./HabitTracker";
import { trpc } from "@/lib/trpc/client";

/**
 * Goal context panel (Sprint 2.12). With a goal selected, shows its progress,
 * forecast + habits; otherwise a portfolio snapshot.
 */
export function GoalContextPanel() {
  const goal = useGoal();
  const selected = goal.selected;
  const forecastQuery = trpc.goal.forecast.useQuery(
    { id: selected?.id ?? "" },
    { enabled: !!selected },
  );

  if (selected) {
    return (
      <div className="flex flex-col gap-4 p-4">
        <Text variant="heading-s">{selected.title}</Text>
        <GoalProgress goal={selected} />
        {forecastQuery.data && <GoalForecast forecast={forecastQuery.data} />}
        {selected.habits.some((h) => h.active) && (
          <div>
            <Text variant="label" tone="subtle">
              Habits
            </Text>
            <HabitTracker habits={selected.habits} onComplete={goal.completeHabit} />
          </div>
        )}
      </div>
    );
  }

  const p = goal.portfolio;
  return (
    <div className="flex flex-col gap-3 p-4">
      <span className="inline-flex items-center gap-1.5">
        <Target size={14} aria-hidden className="text-fg-subtle" />
        <Text variant="heading-s">Goals</Text>
      </span>
      {p ? (
        <div className="flex flex-col gap-1">
          <Text variant="body-s">
            {p.activeCount} active · {p.overallProgress}% overall
          </Text>
          <Text variant="caption" tone="subtle">
            {p.behindCount} behind · best streak {p.habitStreak} days
          </Text>
          {p.nextMilestone && (
            <Text variant="caption" tone="subtle">
              Next: {p.nextMilestone.title}
              {p.nextMilestone.dueInDays >= 0 ? ` in ${p.nextMilestone.dueInDays}d` : ""}
            </Text>
          )}
        </div>
      ) : (
        <Text variant="body-s" tone="subtle">
          Select a goal to see its progress and forecast.
        </Text>
      )}
    </div>
  );
}
