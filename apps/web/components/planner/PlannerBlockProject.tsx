"use client";

import { FolderKanban } from "lucide-react";
import { Text } from "@myos/ui";
import { trpc } from "@/lib/trpc/client";

/**
 * Planner ↔ Project link (Sprint 2.8.5). For a task-backed block, surfaces the
 * task's owning Project → Milestone so the Planner shows what outcome the block
 * advances. Read-only; the hierarchy is owned by Projects.
 */
export function PlannerBlockProject({ taskId }: { taskId: string | null }) {
  const tasksQuery = trpc.task.list.useQuery({ limit: 500 }, { enabled: !!taskId });
  const projectsQuery = trpc.project.list.useQuery({}, { enabled: !!taskId });

  if (!taskId) return null;
  const task = tasksQuery.data?.find((t) => t.id === taskId);
  if (!task?.projectId) return null;
  const project = projectsQuery.data?.find((p) => p.id === task.projectId);
  if (!project) return null;
  const milestone = task.milestoneId
    ? project.milestones.find((m) => m.id === task.milestoneId)
    : null;

  return (
    <div className="flex items-center gap-1.5">
      <FolderKanban size={13} aria-hidden className="text-fg-subtle" />
      <Text variant="caption" tone="subtle">
        {project.name}
        {milestone ? ` · ${milestone.title}` : ""}
      </Text>
    </div>
  );
}
