import type { Task } from "../task";
import { tasksForMilestone } from "./hierarchy";
import type { Milestone } from "./types";

/**
 * Milestone helpers (Sprint 2.8). Ordering, completion and forecast. The Planner
 * consumes milestone deadlines; the Calendar surfaces their due dates.
 */
export function sortMilestones(milestones: Milestone[]): Milestone[] {
  return [...milestones].sort(
    (a, b) => a.order - b.order || (a.dueDate ?? "").localeCompare(b.dueDate ?? ""),
  );
}

/** Completion % of a milestone from its tasks (or 100/0 from its flag). */
export function milestoneProgress(milestone: Milestone, tasks: Task[]): number {
  if (milestone.completed) return 100;
  const owned = tasksForMilestone(tasks, milestone.id);
  if (owned.length === 0) return 0;
  const done = owned.filter((t) => t.status === "completed").length;
  return Math.round((done / owned.length) * 100);
}

export function overdueMilestones(milestones: Milestone[], now: Date): Milestone[] {
  const t = now.getTime();
  return milestones.filter(
    (m) => !m.completed && m.dueDate !== null && new Date(m.dueDate).getTime() < t,
  );
}

/** The next incomplete milestone by due date. */
export function nextMilestone(milestones: Milestone[], now: Date): Milestone | null {
  const t = now.getTime();
  return (
    sortMilestones(milestones.filter((m) => !m.completed))
      .filter((m) => m.dueDate === null || new Date(m.dueDate).getTime() >= t)
      .sort((a, b) => (a.dueDate ?? "").localeCompare(b.dueDate ?? ""))[0] ??
    sortMilestones(milestones.filter((m) => !m.completed))[0] ??
    null
  );
}

export function completeMilestone(milestone: Milestone): Milestone {
  return { ...milestone, completed: true };
}

export function milestoneCompletion(milestones: Milestone[]): { completed: number; total: number } {
  return {
    completed: milestones.filter((m) => m.completed).length,
    total: milestones.length,
  };
}
