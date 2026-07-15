"use client";

import { ChevronRight } from "lucide-react";
import { Text } from "@myos/ui";
import { totalKeyResults, type Goal } from "@myos/core/goal";
import { GOAL_TYPE_LABEL } from "./goal-icons";

/**
 * GoalHierarchy (Sprint 2.12). Shows the strategic chain for a goal:
 * Goal → Objective → Key Result, plus counts of linked projects.
 */
export function GoalHierarchy({ goal }: { goal: Goal }) {
  const projectLinks = goal.links.filter((l) => l.target === "project").length;
  return (
    <div className="flex flex-col gap-2">
      <div className="text-fg-subtle text-caption flex flex-wrap items-center gap-1">
        <span>{GOAL_TYPE_LABEL[goal.goalType]} goal</span>
        <ChevronRight size={12} aria-hidden />
        <span>{goal.objectives.length} objectives</span>
        <ChevronRight size={12} aria-hidden />
        <span>{totalKeyResults(goal)} key results</span>
        <ChevronRight size={12} aria-hidden />
        <span>{projectLinks} linked projects</span>
      </div>
      {goal.objectives.length === 0 ? (
        <Text variant="body-s" tone="subtle">
          Add objectives + key results to make this goal measurable.
        </Text>
      ) : (
        <ul className="border-border flex flex-col gap-1 border-l pl-3">
          {goal.objectives.map((o) => (
            <li key={o.id}>
              <Text variant="body-s">{o.title}</Text>
              {o.keyResults.length > 0 && (
                <ul className="border-border ml-3 border-l pl-3">
                  {o.keyResults.map((kr) => (
                    <li key={kr.id}>
                      <Text variant="caption" tone="subtle">
                        {kr.title}
                      </Text>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
