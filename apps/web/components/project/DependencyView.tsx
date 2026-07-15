"use client";

import { ArrowRight, GitBranch } from "lucide-react";
import { Text } from "@myos/ui";
import type { Project, ProjectDependency } from "@myos/core/project";

/**
 * DependencyView (Sprint 2.8). Lists a project's upstream dependencies (the
 * projects it depends on). The DAG + cycle rejection live in the pure engine.
 */
export function DependencyView({
  projectId,
  dependencies,
  projects,
}: {
  projectId: string;
  dependencies: ProjectDependency[];
  projects: Project[];
}) {
  const nameOf = (id: string) => projects.find((p) => p.id === id)?.name ?? id;
  const mine = dependencies.filter((d) => d.projectId === projectId);
  const self = projects.find((p) => p.id === projectId);

  if (mine.length === 0) {
    return (
      <Text variant="body-s" tone="subtle">
        No dependencies — this project can start anytime.
      </Text>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {mine.map((d) => {
        const upstream = projects.find((p) => p.id === d.dependsOn);
        const blocked = upstream ? upstream.status !== "completed" : true;
        return (
          <li key={d.dependsOn} className="flex items-center gap-2">
            <GitBranch size={14} aria-hidden className="text-fg-subtle" />
            <Text variant="body-s">{nameOf(d.dependsOn)}</Text>
            <ArrowRight size={14} aria-hidden className="text-fg-subtle" />
            <Text variant="body-s" tone={blocked ? "danger" : "subtle"}>
              {self?.name ?? "this project"}
            </Text>
          </li>
        );
      })}
    </ul>
  );
}
