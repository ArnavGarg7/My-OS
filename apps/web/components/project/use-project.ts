"use client";

import { useMemo, useState } from "react";
import type { CreateProjectSchemaInput, ProjectSort, ProjectStatus } from "@myos/core/project";
import { filterProjects, sortProjects } from "@myos/core/project";
import { useToaster } from "@/lib/framework";
import { useShellStore } from "@/lib/shell/store";
import { trpc } from "@/lib/trpc/client";
import { useOptionalTimeline } from "@/lib/timeline";
import { useOptionalAnalytics } from "@/lib/analytics";

export type { ProjectSort };

/**
 * Client project controller (Sprint 2.8). Owns the filter/sort/search state,
 * fetches projects + portfolio, and exposes the project lifecycle mutations.
 * Selection is shared via the shell store (drives the inspector/context panel).
 */
export function useProject() {
  const utils = trpc.useUtils();
  const toaster = useToaster();
  const timeline = useOptionalTimeline();
  const analytics = useOptionalAnalytics();
  const selectedId = useShellStore((s) => s.selectedProjectId);
  const setSelectedId = useShellStore((s) => s.setSelectedProjectId);

  const [statusFilter, setStatusFilter] = useState<ProjectStatus | null>(null);
  const [sort, setSort] = useState<ProjectSort>("priority");
  const [query, setQuery] = useState("");

  const listQuery = trpc.project.list.useQuery({});
  const portfolioQuery = trpc.project.portfolio.useQuery();

  const allProjects = useMemo(() => listQuery.data ?? [], [listQuery.data]);

  const projects = useMemo(() => {
    const now = new Date();
    let out = filterProjects(allProjects, statusFilter ? { status: statusFilter } : {}, [], now);
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      out = out.filter(
        (p) => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q),
      );
    }
    return sortProjects(out, sort, [], now);
  }, [allProjects, statusFilter, query, sort]);

  const refresh = () => {
    utils.project.list.invalidate();
    utils.project.portfolio.invalidate();
  };

  const createM = trpc.project.create.useMutation({
    onSuccess: (project) => {
      refresh();
      toaster.success("Project created");
      timeline.emit({
        kind: "project.created",
        source: "project",
        title: project.name,
        meta: { id: project.id },
      });
    },
    onError: (e) => toaster.error("Couldn't create", e.message),
  });
  const updateM = trpc.project.update.useMutation({ onSuccess: refresh });
  const archiveM = trpc.project.archive.useMutation({
    onSuccess: () => {
      refresh();
      toaster.success("Project archived");
    },
  });
  const deleteM = trpc.project.delete.useMutation({
    onSuccess: () => {
      refresh();
      setSelectedId(null);
    },
  });
  const createMilestoneM = trpc.project.createMilestone.useMutation({ onSuccess: refresh });
  const completeMilestoneM = trpc.project.completeMilestone.useMutation({
    onSuccess: (milestone) => {
      refresh();
      timeline.emit({
        kind: "milestone.completed",
        source: "project",
        title: milestone.title,
        meta: { id: milestone.id, projectId: milestone.projectId },
      });
      analytics.track({ kind: "milestone.completed" });
    },
  });
  const createObjectiveM = trpc.project.createObjective.useMutation({ onSuccess: refresh });
  const updateObjectiveM = trpc.project.updateObjective.useMutation({ onSuccess: refresh });

  return {
    projects,
    allProjects,
    isLoading: listQuery.isLoading,
    portfolio: portfolioQuery.data ?? null,
    statusFilter,
    setStatusFilter,
    sort,
    setSort,
    query,
    setQuery,
    selectedId,
    selected: allProjects.find((p) => p.id === selectedId) ?? null,
    select: (id: string | null) => setSelectedId(id),
    create: (input: CreateProjectSchemaInput) => createM.mutate(input),
    update: (input: Parameters<typeof updateM.mutate>[0]) => updateM.mutate(input),
    archive: (id: string) => archiveM.mutate({ id }),
    remove: (id: string) => deleteM.mutate({ id }),
    createMilestone: (input: Parameters<typeof createMilestoneM.mutate>[0]) =>
      createMilestoneM.mutate(input),
    completeMilestone: (id: string) => completeMilestoneM.mutate({ id }),
    createObjective: (input: Parameters<typeof createObjectiveM.mutate>[0]) =>
      createObjectiveM.mutate(input),
    updateObjective: (id: string, currentValue: number) =>
      updateObjectiveM.mutate({ id, currentValue }),
    pending: createM.isPending || updateM.isPending || archiveM.isPending || deleteM.isPending,
  };
}
