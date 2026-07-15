"use client";

import { useState } from "react";
import { Button, Input, Textarea } from "@myos/ui";
import { PageContainer, PageContent, PageLoading } from "@/components/framework";
import { useModal } from "@/lib/framework";
import { useShellStore } from "@/lib/shell/store";
import type { CreateProjectSchemaInput } from "@myos/core/project";
import { useProject } from "./use-project";
import { ProjectToolbar, type ProjectView } from "./ProjectToolbar";
import { ProjectList } from "./ProjectList";
import { ProjectSidebar } from "./ProjectSidebar";
import { ProjectInspector } from "./ProjectInspector";
import { Roadmap } from "./Roadmap";
import { PortfolioOverview } from "./PortfolioOverview";

/** Inline "new project" form. */
function CreateProjectInline({
  onCreate,
  close,
}: {
  onCreate: (input: CreateProjectSchemaInput) => void;
  close: () => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const submit = () => {
    if (!name.trim()) return;
    onCreate({ name: name.trim(), description: description.trim() || undefined });
    close();
  };
  return (
    <div className="flex flex-col gap-3 pt-2">
      <Input
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Project name…"
        onKeyDown={(e) => e.key === "Enter" && name.trim() && submit()}
      />
      <Textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="What outcome does this drive? (optional)"
        rows={3}
      />
      <div className="flex justify-end">
        <Button disabled={!name.trim()} onClick={submit}>
          Create project
        </Button>
      </div>
    </div>
  );
}

/**
 * Projects page (Sprint 2.8). The long-term outcomes surface — a filterable
 * project list, roadmap and portfolio views, with a per-project inspector.
 * Selecting a project also feeds the shared context panel.
 */
export function ProjectsPage() {
  const controller = useProject();
  const { open } = useModal();
  const openContextPanel = useShellStore((s) => s.setContextPanelOpen);
  const [view, setView] = useState<ProjectView>("list");

  const select = (id: string) => {
    controller.select(id);
    openContextPanel(true);
  };

  if (controller.isLoading) return <PageLoading label="Loading your projects…" />;

  const onNew = () =>
    open((close) => <CreateProjectInline onCreate={controller.create} close={close} />, {
      title: "New project",
      size: "sm",
    });

  return (
    <PageContainer width="full" className="p-0">
      <PageContent className="gap-0 p-0">
        <ProjectToolbar
          view={view}
          onView={setView}
          sort={controller.sort}
          onSort={controller.setSort}
          query={controller.query}
          onQuery={controller.setQuery}
          onNew={onNew}
        />
        <div className="flex min-h-0 flex-1">
          <div className="min-w-0 flex-1 overflow-y-auto p-4">
            {view === "roadmap" ? (
              <Roadmap projects={controller.allProjects} />
            ) : view === "portfolio" ? (
              controller.portfolio ? (
                <PortfolioOverview summary={controller.portfolio} />
              ) : null
            ) : controller.selected ? (
              <ProjectInspector project={controller.selected} controller={controller} />
            ) : (
              <ProjectList
                projects={controller.projects}
                selectedId={controller.selectedId}
                onSelect={select}
              />
            )}
          </div>
          <aside className="border-border hidden w-72 shrink-0 overflow-y-auto border-l lg:block">
            {view === "list" && controller.selected ? (
              <div className="p-4">
                <Button size="sm" variant="ghost" onClick={() => controller.select(null)}>
                  ← All projects
                </Button>
                <ProjectList
                  projects={controller.projects}
                  selectedId={controller.selectedId}
                  onSelect={select}
                />
              </div>
            ) : (
              <ProjectSidebar controller={controller} />
            )}
          </aside>
        </div>
      </PageContent>
    </PageContainer>
  );
}
