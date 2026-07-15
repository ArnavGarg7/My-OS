"use client";

import { Target } from "lucide-react";
import { cn, EmptyState, Progress, Text } from "@myos/ui";
import { goalProgress, type Goal } from "@myos/core/goal";
import { GOAL_TYPE_ICON, GOAL_TYPE_LABEL } from "./goal-icons";

/**
 * GoalDashboard (Sprint 2.12). The grid of goal cards with derived progress;
 * selecting one opens it in the viewer / context panel.
 */
export function GoalDashboard({
  goals,
  selectedId,
  onSelect,
}: {
  goals: Goal[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  if (goals.length === 0) {
    return (
      <EmptyState
        icon={Target}
        title="No goals yet"
        description="Set a life goal — the strategic layer measuring whether your outcomes advance."
      />
    );
  }
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {goals.map((goal) => {
        const Icon = GOAL_TYPE_ICON[goal.goalType];
        const p = goalProgress(goal);
        return (
          <button
            key={goal.id}
            type="button"
            onClick={() => onSelect(goal.id)}
            aria-pressed={goal.id === selectedId}
            className={cn(
              "border-border hover:border-accent/60 flex flex-col gap-2 rounded-lg border p-3 text-left transition-colors",
              goal.id === selectedId && "border-accent ring-accent/30 ring-1",
            )}
          >
            <div className="flex items-center gap-2">
              <Icon size={16} aria-hidden className="text-fg-subtle shrink-0" />
              <Text variant="body-s" className="truncate font-medium">
                {goal.title}
              </Text>
            </div>
            <Progress value={p.overall} />
            <Text variant="caption" tone="subtle">
              {GOAL_TYPE_LABEL[goal.goalType]} · {p.overall}%
            </Text>
          </button>
        );
      })}
    </div>
  );
}
