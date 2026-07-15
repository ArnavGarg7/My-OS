import type { Task } from "../task";
import type { ProjectHealth } from "./constants";
import { tasksForProject } from "./hierarchy";
import { missedObjectives } from "./objectives";
import { overdueMilestones } from "./milestones";
import type { HealthResult, Project } from "./types";

/**
 * Health engine (Sprint 2.8). Deterministic scoring from overdue milestones,
 * blocked tasks, missed objectives and an overdue project target. Higher score =
 * healthier. Nothing is auto-resolved.
 */
export function assessHealth(project: Project, tasks: Task[], now: Date): HealthResult {
  if (project.status === "completed") {
    return { status: "completed", score: 100, reasons: ["Project is complete."] };
  }

  const owned = tasksForProject(tasks, project.id);
  const blocked = owned.filter((t) => t.status === "blocked");
  const overdue = overdueMilestones(project.milestones, now);
  const missed = missedObjectives(project.objectives);
  const targetOverdue =
    project.targetDate !== null && new Date(project.targetDate).getTime() < now.getTime();

  const reasons: string[] = [];
  let score = 100;
  if (overdue.length > 0) {
    score -= overdue.length * 15;
    reasons.push(`${overdue.length} overdue milestone${overdue.length === 1 ? "" : "s"}`);
  }
  if (blocked.length > 0) {
    score -= blocked.length * 10;
    reasons.push(`${blocked.length} blocked task${blocked.length === 1 ? "" : "s"}`);
  }
  if (missed.length > 0) {
    score -= missed.length * 10;
    reasons.push(`${missed.length} objective${missed.length === 1 ? "" : "s"} behind`);
  }
  if (targetOverdue) {
    score -= 25;
    reasons.push("Target date has passed");
  }
  score = Math.max(0, Math.min(100, score));

  let status: ProjectHealth;
  if (blocked.length > 0 && score < 60) status = "blocked";
  else if (score >= 80) status = "healthy";
  else if (score >= 55) status = "at_risk";
  else status = "behind";

  if (reasons.length === 0) reasons.push("On track — no issues detected.");
  return { status, score, reasons };
}
