"use client";

import { useMemo, useState } from "react";
import {
  filterGoals,
  searchGoals,
  sortGoals,
  type CreateGoalSchemaInput,
  type GoalSort,
  type GoalType,
} from "@myos/core/goal";
import { useToaster } from "@/lib/framework";
import { useShellStore } from "@/lib/shell/store";
import { trpc } from "@/lib/trpc/client";
import { useOptionalTimeline } from "@/lib/timeline";
import { useOptionalAnalytics } from "@/lib/analytics";

/**
 * Client goal controller (Sprint 2.12). Fetches goals + habits + portfolio,
 * derives the view (filter/sort/search) with the pure engine, and exposes the
 * goal / objective / key-result / habit / review mutations. Emits timeline +
 * analytics events. Selection is shared with the context panel via the store.
 */
export function useGoal() {
  const utils = trpc.useUtils();
  const toaster = useToaster();
  const timeline = useOptionalTimeline();
  const analytics = useOptionalAnalytics();
  const selectedId = useShellStore((s) => s.selectedGoalId);
  const setSelectedId = useShellStore((s) => s.setSelectedGoalId);

  const [typeFilter, setTypeFilter] = useState<GoalType | null>(null);
  const [sort, setSort] = useState<GoalSort>("priority");
  const [query, setQuery] = useState("");

  const listQuery = trpc.goal.list.useQuery({});
  const habitsQuery = trpc.goal.habits.useQuery();
  const portfolioQuery = trpc.goal.portfolio.useQuery();

  const goals = useMemo(() => listQuery.data ?? [], [listQuery.data]);

  const view = useMemo(() => {
    const filtered = filterGoals(goals, typeFilter ? { goalType: typeFilter } : {});
    const searched = query.trim() ? searchGoals(filtered, query) : filtered;
    return sortGoals(searched, sort);
  }, [goals, typeFilter, query, sort]);

  const refresh = () => {
    utils.goal.list.invalidate();
    utils.goal.portfolio.invalidate();
    utils.goal.habits.invalidate();
  };

  const createM = trpc.goal.create.useMutation({
    onSuccess: (goal) => {
      refresh();
      toaster.success("Goal created");
      setSelectedId(goal.id);
      timeline.emit({
        kind: "goal.created",
        source: "goal",
        title: goal.title,
        meta: { id: goal.id },
      });
      analytics.track({ kind: "goal.progress", value: 0 });
    },
    onError: (e) => toaster.error("Couldn't create goal", e.message),
  });
  const updateM = trpc.goal.update.useMutation({
    onSuccess: (goal) => {
      refresh();
      if (goal.status === "completed") {
        timeline.emit({
          kind: "goal.completed",
          source: "goal",
          title: goal.title,
          meta: { id: goal.id },
        });
        toaster.success("Goal achieved! 🎉");
      }
    },
  });
  const archiveM = trpc.goal.archive.useMutation({
    onSuccess: () => {
      refresh();
      setSelectedId(null);
    },
  });
  const createObjectiveM = trpc.goal.createObjective.useMutation({ onSuccess: refresh });
  const createKeyResultM = trpc.goal.createKeyResult.useMutation({ onSuccess: refresh });
  const updateKeyResultM = trpc.goal.updateKeyResult.useMutation({ onSuccess: refresh });
  const createHabitM = trpc.goal.createHabit.useMutation({ onSuccess: refresh });
  const completeHabitM = trpc.goal.completeHabit.useMutation({
    onSuccess: (habit) => {
      refresh();
      timeline.emit({ kind: "habit.completed", source: "goal", title: habit.title });
      analytics.track({ kind: "habit.streak", value: habit.currentStreak });
    },
  });
  const createReviewM = trpc.goal.createReview.useMutation({
    onSuccess: () => {
      utils.goal.reviews.invalidate();
      toaster.success("Review saved");
      timeline.emit({ kind: "goal.review_completed", source: "goal", title: "Goal review" });
      analytics.track({ kind: "goal.review" });
    },
  });

  return {
    goals,
    view,
    habits: habitsQuery.data ?? [],
    portfolio: portfolioQuery.data ?? null,
    isLoading: listQuery.isLoading,
    typeFilter,
    setTypeFilter,
    sort,
    setSort,
    query,
    setQuery,
    selectedId,
    selected: goals.find((g) => g.id === selectedId) ?? null,
    select: (id: string | null) => setSelectedId(id),
    create: (input: CreateGoalSchemaInput) => createM.mutate(input),
    update: (input: Parameters<typeof updateM.mutate>[0]) => updateM.mutate(input),
    archive: (id: string) => archiveM.mutate({ id }),
    createObjective: (input: Parameters<typeof createObjectiveM.mutate>[0]) =>
      createObjectiveM.mutate(input),
    createKeyResult: (input: Parameters<typeof createKeyResultM.mutate>[0]) =>
      createKeyResultM.mutate(input),
    updateKeyResult: (id: string, currentValue: number) =>
      updateKeyResultM.mutate({ id, currentValue }),
    createHabit: (input: Parameters<typeof createHabitM.mutate>[0]) => createHabitM.mutate(input),
    completeHabit: (id: string) => completeHabitM.mutate({ id }),
    createReview: (goalId: string, reviewPeriod: "weekly" | "monthly" | "quarterly" | "yearly") =>
      createReviewM.mutate({ goalId, reviewPeriod }),
    pending: createM.isPending || updateM.isPending || archiveM.isPending,
  };
}
