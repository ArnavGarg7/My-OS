import type { Task } from "../task";
import {
  OPEN_PROJECT_STATUSES,
  PROJECT_HEALTH,
  UPCOMING_DAYS,
  type ProjectHealth,
} from "./constants";
import { calculateProgress } from "./progress";
import { assessHealth } from "./health";
import type { PortfolioSummary, Project } from "./types";

/**
 * Portfolio engine (Sprint 2.8). Aggregates projects into headline metrics —
 * overall completion, health distribution, open milestones, blocked work and
 * upcoming deadlines. Deterministic; equal weighting across projects.
 */
const DAY_MS = 86_400_000;

export function summarize(projects: Project[], tasks: Task[], now: Date): PortfolioSummary {
  const active = projects.filter((p) => OPEN_PROJECT_STATUSES.includes(p.status));

  const distribution: Record<ProjectHealth, number> = {
    healthy: 0,
    at_risk: 0,
    behind: 0,
    blocked: 0,
    completed: 0,
  };
  let completionSum = 0;
  let atRiskCount = 0;
  for (const project of projects) {
    completionSum += calculateProgress(project, tasks, now).overall;
    const health = assessHealth(project, tasks, now).status;
    distribution[health] += 1;
    if (health === "at_risk" || health === "behind" || health === "blocked") atRiskCount += 1;
  }

  const openMilestones = active.reduce(
    (sum, p) => sum + p.milestones.filter((m) => !m.completed).length,
    0,
  );
  const projectIds = new Set(projects.map((p) => p.id));
  const blockedTasks = tasks.filter(
    (t) => t.status === "blocked" && t.projectId && projectIds.has(t.projectId),
  ).length;

  const soon = now.getTime() + UPCOMING_DAYS * DAY_MS;
  const upcomingDeadlines = active
    .flatMap((p) =>
      p.milestones
        .filter((m) => !m.completed && m.dueDate && new Date(m.dueDate).getTime() <= soon)
        .map((m) => ({ projectId: p.id, title: m.title, dueDate: m.dueDate! })),
    )
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));

  return {
    projectCount: projects.length,
    activeCount: active.length,
    overallCompletion: projects.length > 0 ? Math.round(completionSum / projects.length) : 0,
    healthDistribution: distribution,
    atRiskCount,
    openMilestones,
    blockedTasks,
    upcomingDeadlines,
  };
}

export const ALL_HEALTH = PROJECT_HEALTH;
