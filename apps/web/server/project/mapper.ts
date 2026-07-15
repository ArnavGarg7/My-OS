import "server-only";
import type {
  Milestone,
  Objective,
  Project,
  ProjectColor,
  ProjectPriority,
  ProjectStatus,
} from "@myos/core/project";
import type { MilestoneRow, ObjectiveRow, ProjectDependencyRow, ProjectRow } from "@myos/db/schema";

/**
 * Project row ↔ DTO mapping (Sprint 2.8). Timestamps become ISO strings for the
 * pure engine + client. Milestones / objectives / dependencies are hydrated in.
 */
export function projectRowToProject(
  row: ProjectRow,
  milestones: Milestone[] = [],
  objectives: Objective[] = [],
  dependencies: string[] = [],
): Project {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    status: row.status as ProjectStatus,
    priority: row.priority as ProjectPriority,
    color: row.color as ProjectColor,
    owner: row.owner,
    startDate: row.startDate ? row.startDate.toISOString() : null,
    targetDate: row.targetDate ? row.targetDate.toISOString() : null,
    completedAt: row.completedAt ? row.completedAt.toISOString() : null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    milestones,
    objectives,
    dependencies,
  };
}

export function projectToColumns(project: Project) {
  return {
    name: project.name,
    description: project.description,
    status: project.status,
    priority: project.priority,
    color: project.color,
    owner: project.owner,
    startDate: project.startDate ? new Date(project.startDate) : null,
    targetDate: project.targetDate ? new Date(project.targetDate) : null,
    completedAt: project.completedAt ? new Date(project.completedAt) : null,
    updatedAt: new Date(project.updatedAt),
  };
}

export function milestoneRowToMilestone(row: MilestoneRow): Milestone {
  return {
    id: row.id,
    projectId: row.projectId,
    title: row.title,
    description: row.description,
    dueDate: row.dueDate ? row.dueDate.toISOString() : null,
    completed: row.completed,
    order: row.order,
  };
}

export function objectiveRowToObjective(row: ObjectiveRow): Objective {
  return {
    id: row.id,
    projectId: row.projectId,
    title: row.title,
    targetValue: row.targetValue,
    currentValue: row.currentValue,
    unit: row.unit,
    completed: row.completed,
  };
}

export function dependencyRowToId(row: ProjectDependencyRow): string {
  return row.dependsOn;
}
