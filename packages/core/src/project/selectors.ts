import type { Task } from "../task";
import {
  OPEN_PROJECT_STATUSES,
  PRIORITY_WEIGHT,
  type ProjectHealth,
  type ProjectStatus,
} from "./constants";
import { assessHealth } from "./health";
import { calculateProgress } from "./progress";
import type { Project } from "./types";

/**
 * Project selectors (Sprint 2.8). Pure read helpers over a project list.
 */
export type ProjectSort = "priority" | "progress" | "target" | "name";

export interface ProjectFilter {
  status?: ProjectStatus | undefined;
  health?: ProjectHealth | undefined;
}

export function selectActive(projects: Project[]): Project[] {
  return projects.filter((p) => OPEN_PROJECT_STATUSES.includes(p.status));
}

export function filterProjects(
  projects: Project[],
  filter: ProjectFilter,
  tasks: Task[],
  now: Date,
): Project[] {
  return projects.filter((p) => {
    if (filter.status && p.status !== filter.status) return false;
    if (filter.health && assessHealth(p, tasks, now).status !== filter.health) return false;
    return true;
  });
}

export function sortProjects(
  projects: Project[],
  sort: ProjectSort,
  tasks: Task[],
  now: Date,
): Project[] {
  const copy = [...projects];
  switch (sort) {
    case "priority":
      return copy.sort(
        (a, b) =>
          PRIORITY_WEIGHT[b.priority] - PRIORITY_WEIGHT[a.priority] || a.name.localeCompare(b.name),
      );
    case "progress":
      return copy.sort(
        (a, b) =>
          calculateProgress(b, tasks, now).overall - calculateProgress(a, tasks, now).overall,
      );
    case "target":
      return copy.sort((a, b) => (a.targetDate ?? "").localeCompare(b.targetDate ?? ""));
    case "name":
    default:
      return copy.sort((a, b) => a.name.localeCompare(b.name));
  }
}

export function searchProjects(projects: Project[], text: string): Project[] {
  const q = text.trim().toLowerCase();
  if (!q) return projects;
  return projects.filter(
    (p) => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q),
  );
}

/** The highest-priority active project (for Today / status bar). */
export function topProject(projects: Project[]): Project | null {
  return (
    selectActive(projects).sort(
      (a, b) =>
        PRIORITY_WEIGHT[b.priority] - PRIORITY_WEIGHT[a.priority] || a.name.localeCompare(b.name),
    )[0] ?? null
  );
}
