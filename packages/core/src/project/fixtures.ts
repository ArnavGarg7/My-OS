import { taskEngine, type Task } from "../task";
import { projectEngine } from "./engine";
import type { Milestone, Objective, Project, ProjectDependency } from "./types";

/** Test fixtures for the project engine (imported by *.test.ts). */
export const at = (y: number, mo: number, d: number, h = 9) =>
  new Date(Date.UTC(y, mo, d, h, 0, 0));
export const iso = (y: number, mo: number, d: number) => new Date(Date.UTC(y, mo, d)).toISOString();

export function makeProject(over: Partial<Project> = {}): Project {
  const base = projectEngine.create({ name: over.name ?? "Campus AI" }, at(2026, 6, 1));
  return {
    ...base,
    ...over,
    id: over.id ?? "p1",
    milestones: over.milestones ?? [],
    objectives: over.objectives ?? [],
    dependencies: over.dependencies ?? [],
  };
}

export function makeMilestone(over: Partial<Milestone> = {}): Milestone {
  return {
    id: over.id ?? "m1",
    projectId: over.projectId ?? "p1",
    title: over.title ?? "Sprint 1",
    description: over.description ?? "",
    dueDate: "dueDate" in over ? (over.dueDate ?? null) : iso(2026, 6, 15),
    completed: over.completed ?? false,
    order: over.order ?? 0,
  };
}

export function makeObjective(over: Partial<Objective> = {}): Objective {
  return {
    id: over.id ?? "o1",
    projectId: over.projectId ?? "p1",
    title: over.title ?? "Ship features",
    targetValue: over.targetValue ?? 10,
    currentValue: over.currentValue ?? 0,
    unit: over.unit ?? "features",
    completed: over.completed ?? false,
  };
}

export function makeTask(over: Partial<Task> = {}): Task {
  const base = taskEngine.create({ title: over.title ?? "A task" }, at(2026, 6, 1));
  return {
    ...base,
    ...over,
    id: over.id ?? "t1",
    projectId: "projectId" in over ? (over.projectId ?? null) : "p1",
    labels: over.labels ?? [],
    dependencies: over.dependencies ?? [],
  };
}

export function dep(projectId: string, dependsOn: string): ProjectDependency {
  return { projectId, dependsOn };
}
