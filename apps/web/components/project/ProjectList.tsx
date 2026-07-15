"use client";

import { FolderKanban } from "lucide-react";
import { EmptyState } from "@myos/ui";
import type { Project } from "@myos/core/project";
import { ProjectCard } from "./ProjectCard";

/**
 * ProjectList (Sprint 2.8). The vertical list of project cards. Empty state
 * nudges the user to create their first project.
 */
export function ProjectList({
  projects,
  selectedId,
  onSelect,
}: {
  projects: Project[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  if (projects.length === 0) {
    return (
      <EmptyState
        icon={FolderKanban}
        title="No projects yet"
        description="Create a project to group milestones, objectives and tasks toward an outcome."
      />
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {projects.map((project) => (
        <ProjectCard
          key={project.id}
          project={project}
          selected={project.id === selectedId}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}
