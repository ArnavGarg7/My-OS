"use client";

import { useMemo, useState } from "react";
import { FolderKanban } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Text } from "@myos/ui";
import { useToaster } from "@/lib/framework";
import { trpc } from "@/lib/trpc/client";

const NONE = "__none__";

/**
 * Inbox → Project attach (Sprint 2.8.5). Once a capture has become a task, the
 * user can attach that task to a Project → Milestone → Objective. Suggestions
 * only; the user confirms each level. Persists via `project.attachTask`.
 */
export function InboxProjectAttach({ taskId }: { taskId: string }) {
  const utils = trpc.useUtils();
  const toaster = useToaster();
  const projectsQuery = trpc.project.list.useQuery({});
  const projects = useMemo(() => projectsQuery.data ?? [], [projectsQuery.data]);

  const [projectId, setProjectId] = useState<string | null>(null);
  const current = projects.find((p) => p.id === projectId) ?? null;

  const attach = trpc.project.attachTask.useMutation({
    onSuccess: () => {
      utils.task.list.invalidate();
      utils.project.portfolio.invalidate();
      toaster.success("Attached to project");
    },
    onError: (e) => toaster.error("Couldn't attach", e.message),
  });

  if (projects.length === 0) {
    return (
      <Text variant="body-s" tone="subtle">
        Create a project to attach this task to an outcome.
      </Text>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <Select
        value={projectId ?? NONE}
        onValueChange={(v) => {
          const id = v === NONE ? null : v;
          setProjectId(id);
          attach.mutate({ taskId, projectId: id, milestoneId: null, objectiveId: null });
        }}
      >
        <SelectTrigger aria-label="Attach to project" className="w-full">
          <span className="flex items-center gap-1.5">
            <FolderKanban size={14} aria-hidden className="text-fg-subtle" />
            <SelectValue placeholder="Attach to project…" />
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
        <Select
          value={NONE}
          onValueChange={(v) =>
            attach.mutate({ taskId, projectId, milestoneId: v === NONE ? null : v })
          }
        >
          <SelectTrigger aria-label="Attach to milestone" className="w-full">
            <SelectValue placeholder="Milestone…" />
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
        <Select
          value={NONE}
          onValueChange={(v) =>
            attach.mutate({ taskId, projectId, objectiveId: v === NONE ? null : v })
          }
        >
          <SelectTrigger aria-label="Attach to objective" className="w-full">
            <SelectValue placeholder="Objective…" />
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
    </div>
  );
}
