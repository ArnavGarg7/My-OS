"use client";

import { useMemo } from "react";
import { FolderKanban } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Text } from "@myos/ui";
import type { Task } from "@myos/core/task";
import { useToaster } from "@/lib/framework";
import { trpc } from "@/lib/trpc/client";

const NONE = "__none__";

/**
 * Task → Project hierarchy picker (Sprint 2.8.5). Attaches a task to a Project,
 * then optionally a Milestone / Objective within it. Suggestions only — the user
 * confirms each level. Persists via `project.attachTask` and refreshes tasks.
 */
export function TaskProjectPicker({ task }: { task: Task }) {
  const utils = trpc.useUtils();
  const toaster = useToaster();
  const projectsQuery = trpc.project.list.useQuery({});
  const projects = useMemo(() => projectsQuery.data ?? [], [projectsQuery.data]);
  const current = projects.find((p) => p.id === task.projectId) ?? null;

  const attach = trpc.project.attachTask.useMutation({
    onSuccess: () => {
      utils.task.list.invalidate();
      utils.project.portfolio.invalidate();
    },
    onError: (e) => toaster.error("Couldn't attach", e.message),
  });

  const setProject = (value: string) =>
    attach.mutate({
      taskId: task.id,
      projectId: value === NONE ? null : value,
      milestoneId: null,
      objectiveId: null,
    });

  const setMilestone = (value: string) =>
    attach.mutate({
      taskId: task.id,
      projectId: task.projectId,
      milestoneId: value === NONE ? null : value,
    });

  const setObjective = (value: string) =>
    attach.mutate({
      taskId: task.id,
      projectId: task.projectId,
      objectiveId: value === NONE ? null : value,
    });

  return (
    <div className="flex flex-col gap-2">
      <Select value={task.projectId ?? NONE} onValueChange={setProject}>
        <SelectTrigger aria-label="Project" className="w-full">
          <span className="flex items-center gap-1.5">
            <FolderKanban size={14} aria-hidden className="text-fg-subtle" />
            <SelectValue placeholder="No project" />
          </span>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={NONE}>No project</SelectItem>
          {projects.map((p) => (
            <SelectItem key={p.id} value={p.id}>
              {p.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {current && current.milestones.length > 0 && (
        <Select value={task.milestoneId ?? NONE} onValueChange={setMilestone}>
          <SelectTrigger aria-label="Milestone" className="w-full">
            <SelectValue placeholder="No milestone" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NONE}>No milestone</SelectItem>
            {current.milestones.map((m) => (
              <SelectItem key={m.id} value={m.id}>
                {m.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {current && current.objectives.length > 0 && (
        <Select value={task.objectiveId ?? NONE} onValueChange={setObjective}>
          <SelectTrigger aria-label="Objective" className="w-full">
            <SelectValue placeholder="No objective" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NONE}>No objective</SelectItem>
            {current.objectives.map((o) => (
              <SelectItem key={o.id} value={o.id}>
                {o.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {!current && (
        <Text variant="caption" tone="subtle">
          Attach this task to a project to track it toward an outcome.
        </Text>
      )}
    </div>
  );
}
