"use client";

import { Text } from "@myos/ui";
import { objectiveProgress, type Goal } from "@myos/core/goal";

/**
 * GoalTimeline (Sprint 2.12). A compact objective-by-objective progress spine
 * for a goal — a deterministic mini-analytic, not the Timeline page.
 */
export function GoalTimeline({ goal }: { goal: Goal }) {
  if (goal.objectives.length === 0) {
    return (
      <Text variant="body-s" tone="subtle">
        Add objectives to chart this goal's progress.
      </Text>
    );
  }
  return (
    <ol className="border-border relative flex flex-col gap-3 border-l pl-4">
      {goal.objectives.map((o) => {
        const p = objectiveProgress(o);
        return (
          <li key={o.id} className="relative">
            <span
              className={`absolute -left-[1.35rem] top-1 size-2.5 rounded-full ${
                p >= 100 ? "bg-success" : "bg-accent"
              }`}
              aria-hidden
            />
            <Text variant="body-s" className={p >= 100 ? "line-through" : ""}>
              {o.title}
            </Text>
            <Text variant="caption" tone="subtle">
              {p}%
            </Text>
          </li>
        );
      })}
    </ol>
  );
}
