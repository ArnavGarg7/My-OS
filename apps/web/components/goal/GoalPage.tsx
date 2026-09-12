"use client";

import { useState } from "react";
import { LayoutGrid } from "lucide-react";
import { Button, StatBlock } from "@myos/ui";
import { PageContainer, PageContent, PageLoading } from "@/components/framework";
import { useShellStore } from "@/lib/shell/store";
import { useGoal } from "./use-goal";
import { GoalDashboard } from "./GoalDashboard";
import { GoalViewer } from "./GoalViewer";
import { GoalCreatorDialog } from "./GoalCreatorDialog";
import { GoalSearch } from "./GoalSearch";
import { HabitTracker } from "./HabitTracker";

/**
 * Goals page (Sprint 2.12). The strategic layer — a dashboard of life goals with
 * derived progress, a per-goal viewer (objectives/key results/habits/reviews),
 * and today's habits. Selecting a goal feeds the shared context panel.
 */
export function GoalPage() {
  const goal = useGoal();
  const openContextPanel = useShellStore((s) => s.setContextPanelOpen);
  const [showHabits, setShowHabits] = useState(false);

  if (goal.isLoading) return <PageLoading label="Opening your goals…" />;

  const select = (id: string) => {
    goal.select(id);
    openContextPanel(true);
  };

  const p = goal.portfolio;

  return (
    <PageContainer width="full" className="p-0">
      <PageContent className="gap-0 p-0">
        <div className="border-border flex flex-wrap items-center gap-2 border-b p-3">
          <Button
            size="sm"
            variant={goal.selected ? "ghost" : "secondary"}
            onClick={() => goal.select(null)}
          >
            <LayoutGrid size={14} aria-hidden />
            Dashboard
          </Button>
          <Button
            size="sm"
            variant={showHabits ? "secondary" : "ghost"}
            onClick={() => setShowHabits((v) => !v)}
          >
            Habits
          </Button>
          <div className="min-w-40 flex-1">
            <GoalSearch value={goal.query} onChange={goal.setQuery} />
          </div>
          <GoalCreatorDialog onCreate={goal.create} />
        </div>

        <div className="flex min-h-0 flex-1">
          <div className="min-w-0 flex-1 overflow-y-auto p-4">
            {goal.selected ? (
              <GoalViewer goal={goal.selected} controller={goal} />
            ) : showHabits ? (
              <HabitTracker habits={goal.habits} onComplete={goal.completeHabit} />
            ) : (
              <div className="flex flex-col gap-4">
                {p && (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <StatBlock label="Active" value={String(p.activeCount)} />
                    <StatBlock label="Overall" value={`${p.overallProgress}%`} />
                    <StatBlock label="Behind" value={String(p.behindCount)} />
                    <StatBlock label="Best streak" value={`${p.habitStreak}d`} />
                  </div>
                )}
                <GoalDashboard goals={goal.view} selectedId={goal.selectedId} onSelect={select} />
              </div>
            )}
          </div>
        </div>
      </PageContent>
    </PageContainer>
  );
}
