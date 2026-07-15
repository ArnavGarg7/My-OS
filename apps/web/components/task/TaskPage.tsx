"use client";

import { useMemo } from "react";
import { PageContainer, PageContent, PageLoading } from "@/components/framework";
import { selectByStatus, selectOpen, type Task } from "@myos/core/task";
import { useShellStore } from "@/lib/shell/store";
import { useTask } from "./use-task";
import { TaskSearch } from "./TaskSearch";
import { TaskFilters } from "./TaskFilters";
import { TaskQuickCreate } from "./TaskQuickCreate";
import { TaskSidebar } from "./TaskSidebar";
import { TaskList } from "./TaskList";

/**
 * Tasks page (Sprint 2.5). Toolbar (search · quick-create · facets · filters)
 * over an editorial list. Selecting a row opens it in the shared context panel.
 */
export function TaskPage() {
  const t = useTask();
  const openContextPanel = useShellStore((s) => s.setContextPanelOpen);
  const now = useMemo(() => new Date(), []);

  const sidebarCounts = useMemo(
    () => ({
      open: selectOpen(t.tasks).length,
      inProgress: selectByStatus(t.tasks, "in_progress").length,
      blocked: selectByStatus(t.tasks, "blocked").length,
      completed: selectByStatus(t.tasks, "completed").length,
    }),
    [t.tasks],
  );

  const select = (id: string) => {
    t.select(id);
    openContextPanel(true);
  };

  const toggle = (task: Task) => {
    if (task.status === "completed") t.update({ id: task.id, status: "not_started" });
    else t.complete(task.id);
  };

  if (t.isLoading) return <PageLoading label="Loading your tasks…" />;

  return (
    <PageContainer width="full" className="p-0">
      <PageContent className="gap-0 p-0">
        <div className="border-border flex flex-col gap-3 border-b p-4">
          <div className="flex items-center gap-2">
            <div className="min-w-0 flex-1">
              <TaskSearch value={t.text} onChange={t.setText} />
            </div>
          </div>
          <TaskQuickCreate onCreate={(title) => t.create({ title })} pending={t.pending} />
          <TaskSidebar active={t.status} counts={sidebarCounts} onSelect={t.setStatus} />
          <TaskFilters
            status={t.status}
            onStatus={t.setStatus}
            priority={t.priority}
            onPriority={t.setPriority}
            labelId={t.labelId}
            onLabel={t.setLabelId}
            labels={t.labels}
            sort={t.sort}
            onSort={t.setSort}
          />
        </div>
        <TaskList
          tasks={t.view}
          selectedId={t.selectedId}
          now={now}
          onSelect={select}
          onToggle={toggle}
          emptyLabel={t.text.trim() ? "No tasks match your search." : undefined}
        />
      </PageContent>
    </PageContainer>
  );
}
