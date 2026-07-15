"use client";

import { Archive, CheckCircle2 } from "lucide-react";
import { Badge, Button, Divider, SectionHeader, Text } from "@myos/ui";
import type { Goal } from "@myos/core/goal";
import { trpc } from "@/lib/trpc/client";
import { GOAL_TYPE_ICON, GOAL_TYPE_LABEL, STATUS_LABEL, STATUS_VARIANT } from "./goal-icons";
import { GoalProgress } from "./GoalProgress";
import { GoalForecast } from "./GoalForecast";
import { GoalHierarchy } from "./GoalHierarchy";
import { GoalTimeline } from "./GoalTimeline";
import { ObjectiveCard } from "./ObjectiveCard";
import { HabitTracker } from "./HabitTracker";
import { GoalReviews } from "./GoalReviews";
import type { useGoal } from "./use-goal";

/**
 * GoalViewer (Sprint 2.12). The full detail surface for a goal: progress,
 * forecast, hierarchy, objectives + key results, habits and reviews.
 */
export function GoalViewer({
  goal,
  controller,
}: {
  goal: Goal;
  controller: ReturnType<typeof useGoal>;
}) {
  const forecastQuery = trpc.goal.forecast.useQuery({ id: goal.id });
  const reviewsQuery = trpc.goal.reviews.useQuery({ goalId: goal.id });
  const Icon = GOAL_TYPE_ICON[goal.goalType];

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <Icon size={18} aria-hidden className="text-fg-subtle" />
            <Text variant="heading-m">{goal.title}</Text>
          </div>
          <div className="flex gap-1">
            {goal.status !== "completed" && (
              <Button
                size="sm"
                variant="ghost"
                aria-label="Complete goal"
                onClick={() => controller.update({ id: goal.id, status: "completed" })}
              >
                <CheckCircle2 size={14} aria-hidden />
              </Button>
            )}
            <Button
              size="sm"
              variant="ghost"
              aria-label="Archive goal"
              onClick={() => controller.archive(goal.id)}
            >
              <Archive size={14} aria-hidden />
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge size="sm" variant={STATUS_VARIANT[goal.status]}>
            {STATUS_LABEL[goal.status]}
          </Badge>
          <Text variant="caption" tone="subtle">
            {GOAL_TYPE_LABEL[goal.goalType]}
            {goal.targetDate ? ` · target ${new Date(goal.targetDate).toLocaleDateString()}` : ""}
          </Text>
        </div>
        {goal.description && (
          <Text variant="body-s" tone="subtle">
            {goal.description}
          </Text>
        )}
      </header>

      <GoalProgress goal={goal} />
      {forecastQuery.data && <GoalForecast forecast={forecastQuery.data} />}

      <Divider />

      <section className="flex flex-col gap-2">
        <SectionHeader title="Hierarchy" />
        <GoalHierarchy goal={goal} />
      </section>

      <section className="flex flex-col gap-2">
        <SectionHeader title="Objectives" />
        {goal.objectives.map((o) => (
          <ObjectiveCard key={o.id} objective={o} onUpdateKeyResult={controller.updateKeyResult} />
        ))}
      </section>

      <section className="flex flex-col gap-2">
        <SectionHeader title="Habits" />
        <HabitTracker habits={goal.habits} onComplete={controller.completeHabit} />
      </section>

      <section className="flex flex-col gap-2">
        <SectionHeader title="Timeline" />
        <GoalTimeline goal={goal} />
      </section>

      <section className="flex flex-col gap-2">
        <SectionHeader title="Reviews" />
        <GoalReviews
          reviews={reviewsQuery.data ?? []}
          onCreate={(period) => controller.createReview(goal.id, period)}
        />
      </section>
    </div>
  );
}
