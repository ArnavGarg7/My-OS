import type { Task } from "../task";

/**
 * Hierarchy helpers (Sprint 2.8). Tasks belong to a project and optionally a
 * milestone/objective. Pure attach/detach + grouping — no mutation in place.
 */
export function tasksForProject(tasks: Task[], projectId: string): Task[] {
  return tasks.filter((t) => t.projectId === projectId);
}

export function tasksForMilestone(tasks: Task[], milestoneId: string): Task[] {
  return tasks.filter((t) => t.milestoneId === milestoneId);
}

export function tasksForObjective(tasks: Task[], objectiveId: string): Task[] {
  return tasks.filter((t) => t.objectiveId === objectiveId);
}

export function attachTask(
  task: Task,
  target: { projectId?: string | null; milestoneId?: string | null; objectiveId?: string | null },
  now: Date,
): Task {
  return {
    ...task,
    ...(target.projectId !== undefined ? { projectId: target.projectId } : {}),
    ...(target.milestoneId !== undefined ? { milestoneId: target.milestoneId } : {}),
    ...(target.objectiveId !== undefined ? { objectiveId: target.objectiveId } : {}),
    updatedAt: now.toISOString(),
  };
}

export function detachTask(task: Task, now: Date): Task {
  return {
    ...task,
    projectId: null,
    milestoneId: null,
    objectiveId: null,
    updatedAt: now.toISOString(),
  };
}

export function unassignedTasks(tasks: Task[]): Task[] {
  return tasks.filter((t) => t.projectId === null);
}
