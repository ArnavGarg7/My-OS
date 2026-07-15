"use client";

import { cn, Text } from "@myos/ui";
import { calculateProgress, type Project } from "@myos/core/project";
import { PRIORITY_LABEL } from "./project-icons";
import { ProgressRing } from "./ProgressRing";
import { ProjectStatusIndicator } from "./ProjectStatusIndicator";

/**
 * ProjectCard (Sprint 2.8). A single project tile — name, status, priority and
 * a derived completion ring. Progress is computed on the client from the loaded
 * milestones/objectives (tasks are folded in server-side for exact figures).
 */
export function ProjectCard({
  project,
  selected,
  onSelect,
}: {
  project: Project;
  selected: boolean;
  onSelect: (id: string) => void;
}) {
  const progress = calculateProgress(project, [], new Date());

  return (
    <button
      type="button"
      onClick={() => onSelect(project.id)}
      aria-pressed={selected}
      className={cn(
        "border-border bg-surface hover:border-accent/60 flex w-full items-center gap-4 rounded-lg border p-4 text-left transition-colors",
        selected && "border-accent ring-accent/30 ring-1",
      )}
    >
      <ProgressRing value={progress.overall} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <Text variant="heading-s" className="truncate">
            {project.name}
          </Text>
        </div>
        <Text variant="body-s" tone="subtle" className="truncate">
          {project.description || "No description"}
        </Text>
        <div className="mt-2 flex items-center gap-2">
          <ProjectStatusIndicator status={project.status} />
          <Text variant="caption" tone="subtle">
            {PRIORITY_LABEL[project.priority]} priority
          </Text>
          <Text variant="caption" tone="subtle">
            · {project.milestones.length} milestones
          </Text>
        </div>
      </div>
    </button>
  );
}
