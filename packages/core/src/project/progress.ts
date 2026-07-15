import type { Task } from "../task";
import { PROGRESS_WEIGHTS } from "./constants";
import { tasksForProject } from "./hierarchy";
import { milestoneCompletion } from "./milestones";
import { objectivesAverage } from "./objectives";
import type { Project, ProjectProgress } from "./types";

/**
 * Progress engine (Sprint 2.8). Overall progress is derived deterministically
 * from completed tasks + milestones + objectives + schedule adherence. No
 * progress value is ever stored or manually edited.
 */
function scheduleAdherence(project: Project, now: Date): number {
  if (!project.startDate || !project.targetDate) return 0;
  const start = new Date(project.startDate).getTime();
  const end = new Date(project.targetDate).getTime();
  if (end <= start) return 0;
  const elapsed = (now.getTime() - start) / (end - start);
  return Math.max(0, Math.min(100, Math.round(elapsed * 100)));
}

export function calculateProgress(project: Project, tasks: Task[], now: Date): ProjectProgress {
  const owned = tasksForProject(tasks, project.id);
  const completedTasks = owned.filter((t) => t.status === "completed").length;
  const tasksPercent = owned.length > 0 ? Math.round((completedTasks / owned.length) * 100) : 0;

  const { completed, total } = milestoneCompletion(project.milestones);
  const milestonesPercent = total > 0 ? Math.round((completed / total) * 100) : 0;

  const objectivesPercent = objectivesAverage(project.objectives);
  const schedulePercent = scheduleAdherence(project, now);

  const overall =
    project.status === "completed"
      ? 100
      : Math.round(
          tasksPercent * PROGRESS_WEIGHTS.tasks +
            milestonesPercent * PROGRESS_WEIGHTS.milestones +
            objectivesPercent * PROGRESS_WEIGHTS.objectives +
            schedulePercent * PROGRESS_WEIGHTS.schedule,
        );

  return {
    tasksPercent,
    milestonesPercent,
    objectivesPercent,
    schedulePercent,
    overall,
    completedTasks,
    totalTasks: owned.length,
    completedMilestones: completed,
    totalMilestones: total,
  };
}
