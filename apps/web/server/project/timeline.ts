import "server-only";
import {
  milestoneProgress,
  sortMilestones,
  tasksForMilestone,
  type Project,
} from "@myos/core/project";
import type { Task } from "@myos/core/task";
import type { Database } from "@myos/db";
import { rowToTask } from "../task/mapper";
import * as repo from "./repository";

/**
 * Project timeline (Sprint 2.8). A milestone-ordered view of a project with each
 * milestone's tasks and derived completion. Deterministic; the Planner consumes
 * milestone deadlines separately.
 */
export interface TimelineMilestone {
  id: string;
  title: string;
  dueDate: string | null;
  completed: boolean;
  progress: number;
  taskCount: number;
  completedTasks: number;
}

export interface ProjectTimeline {
  projectId: string;
  milestones: TimelineMilestone[];
  unassignedTaskCount: number;
}

export async function buildTimeline(db: Database, project: Project): Promise<ProjectTimeline> {
  const tasks: Task[] = (await repo.tasksForProject(db, project.id)).map((r) => rowToTask(r));
  const milestones = sortMilestones(project.milestones).map((m): TimelineMilestone => {
    const owned = tasksForMilestone(tasks, m.id);
    return {
      id: m.id,
      title: m.title,
      dueDate: m.dueDate,
      completed: m.completed,
      progress: milestoneProgress(m, tasks),
      taskCount: owned.length,
      completedTasks: owned.filter((t) => t.status === "completed").length,
    };
  });
  const unassignedTaskCount = tasks.filter((t) => t.milestoneId === null).length;
  return { projectId: project.id, milestones, unassignedTaskCount };
}
