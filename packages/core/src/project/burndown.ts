import type { Task } from "../task";
import { tasksForProject } from "./hierarchy";
import type { BurndownPoint, Project } from "./types";

/**
 * Burndown engine (Sprint 2.8). Deterministic remaining-work-over-time from
 * recorded task completion history, with a straight-line ideal for comparison.
 */
const DAY_MS = 86_400_000;

function dayKey(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

export function computeBurndown(project: Project, tasks: Task[], now: Date): BurndownPoint[] {
  const owned = tasksForProject(tasks, project.id);
  const total = owned.length;
  if (total === 0) return [];

  const startMs = project.startDate
    ? new Date(project.startDate).getTime()
    : new Date(project.createdAt).getTime();
  const endMs = project.targetDate ? new Date(project.targetDate).getTime() : now.getTime();
  const start = Math.min(startMs, now.getTime());
  const end = Math.max(endMs, now.getTime());
  const days = Math.max(1, Math.round((end - start) / DAY_MS));

  // Completed-count by day (cumulative).
  const completionsByDay = new Map<string, number>();
  for (const t of owned) {
    if (t.status === "completed" && t.completedAt) {
      const key = dayKey(new Date(t.completedAt).getTime());
      completionsByDay.set(key, (completionsByDay.get(key) ?? 0) + 1);
    }
  }

  const points: BurndownPoint[] = [];
  let cumulativeDone = 0;
  for (let i = 0; i <= days; i++) {
    const ms = start + i * DAY_MS;
    const key = dayKey(ms);
    cumulativeDone += completionsByDay.get(key) ?? 0;
    const remaining = Math.max(0, total - cumulativeDone);
    const ideal = Math.max(0, Math.round(total - (total * i) / days));
    if (ms <= now.getTime() || i === days) {
      points.push({ date: key, remaining, ideal });
    }
  }
  return points;
}
