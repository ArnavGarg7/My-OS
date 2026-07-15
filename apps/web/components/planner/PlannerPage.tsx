"use client";

import { useState } from "react";
import { PLANNER_BLOCK_TYPES, type PlannerBlockType } from "@myos/core/planner";
import { PageContainer, PageContent, PageLoading } from "@/components/framework";
import { useShellStore } from "@/lib/shell/store";
import { usePlanner } from "./use-planner";
import { PlannerToolbar } from "./PlannerToolbar";
import { PlannerFilters } from "./PlannerFilters";
import { PlannerTimeline } from "./PlannerTimeline";
import { PlannerSidebar } from "./PlannerSidebar";

/**
 * Planner page (Sprint 2.6). Toolbar + editorial vertical timeline with a
 * utilization sidebar. Selecting a block opens it in the shared context panel.
 */
export function PlannerPage() {
  const planner = usePlanner();
  const openContextPanel = useShellStore((s) => s.setContextPanelOpen);
  const [hidden, setHidden] = useState<Set<PlannerBlockType>>(new Set());

  const visible =
    hidden.size === 0 ? null : new Set(PLANNER_BLOCK_TYPES.filter((t) => !hidden.has(t)));

  const toggleType = (type: PlannerBlockType) =>
    setHidden((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });

  const select = (id: string) => {
    planner.select(id);
    openContextPanel(true);
  };

  if (planner.isLoading) return <PageLoading label="Loading your plan…" />;

  return (
    <PageContainer width="full" className="p-0">
      <PageContent className="gap-0 p-0">
        <PlannerToolbar planner={planner} />
        <div className="border-border flex items-center justify-between gap-2 border-b px-4 py-2">
          <PlannerFilters visible={visible} onToggle={toggleType} />
        </div>
        <div className="flex min-h-0 flex-1">
          <div className="min-w-0 flex-1 overflow-y-auto">
            <PlannerTimeline
              blocks={planner.blocks}
              selectedId={planner.selectedId}
              visibleTypes={visible}
              onSelect={select}
            />
          </div>
          <aside className="border-border hidden w-64 shrink-0 overflow-y-auto border-l lg:block">
            <PlannerSidebar planner={planner} />
          </aside>
        </div>
      </PageContent>
    </PageContainer>
  );
}
