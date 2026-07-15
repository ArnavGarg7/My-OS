import type { Task } from "../task";
import { calculateProgress } from "./progress";
import { assessHealth } from "./health";
import { forecast } from "./forecasting";
import { computeBurndown } from "./burndown";
import { buildRoadmap } from "./roadmap";
import { summarize } from "./portfolio";
import { nextMilestone } from "./milestones";
import type {
  BurndownPoint,
  Forecast,
  HealthResult,
  PortfolioSummary,
  Project,
  ProjectProgress,
} from "./types";
import type { ProjectPriority, ProjectStatus } from "./constants";

/**
 * ProjectEngine (Sprint 2.8). Pure, deterministic orchestration over the project
 * sub-engines. Progress / health / forecast / burndown / portfolio are always
 * derived here — never stored. No React, DB, browser or randomness.
 */
export interface CreateProjectInput {
  name: string;
  description?: string | undefined;
  priority?: ProjectPriority | undefined;
  color?: Project["color"] | undefined;
  owner?: string | undefined;
  startDate?: string | null | undefined;
  targetDate?: string | null | undefined;
}

export class ProjectEngine {
  create(input: CreateProjectInput, now: Date): Project {
    const iso = now.toISOString();
    return {
      id: "",
      name: input.name.trim(),
      description: input.description?.trim() ?? "",
      status: "planning",
      priority: input.priority ?? "medium",
      color: input.color ?? "blue",
      owner: input.owner ?? "",
      startDate: input.startDate ?? null,
      targetDate: input.targetDate ?? null,
      completedAt: null,
      createdAt: iso,
      updatedAt: iso,
      milestones: [],
      objectives: [],
      dependencies: [],
    };
  }

  validate(project: Project): string[] {
    const errors: string[] = [];
    if (!project.name.trim()) errors.push("Name is required.");
    if (
      project.startDate &&
      project.targetDate &&
      new Date(project.targetDate).getTime() < new Date(project.startDate).getTime()
    )
      errors.push("Target date must be on or after the start date.");
    return errors;
  }

  private touch(project: Project, now: Date): Project {
    return { ...project, updatedAt: now.toISOString() };
  }

  setStatus(project: Project, status: ProjectStatus, now: Date): Project {
    return this.touch(
      {
        ...project,
        status,
        completedAt: status === "completed" ? now.toISOString() : project.completedAt,
      },
      now,
    );
  }

  complete(project: Project, now: Date): Project {
    return this.setStatus(project, "completed", now);
  }

  archive(project: Project, now: Date): Project {
    return this.setStatus(project, "archived", now);
  }

  progress(project: Project, tasks: Task[], now: Date): ProjectProgress {
    return calculateProgress(project, tasks, now);
  }

  health(project: Project, tasks: Task[], now: Date): HealthResult {
    return assessHealth(project, tasks, now);
  }

  forecast(project: Project, tasks: Task[], now: Date): Forecast {
    return forecast(project, tasks, now);
  }

  burndown(project: Project, tasks: Task[], now: Date): BurndownPoint[] {
    return computeBurndown(project, tasks, now);
  }

  portfolio(projects: Project[], tasks: Task[], now: Date): PortfolioSummary {
    return summarize(projects, tasks, now);
  }

  roadmap(projects: Project[]) {
    return buildRoadmap(projects);
  }

  /** A per-project headline for the context panel / Today. */
  summary(project: Project, tasks: Task[], now: Date) {
    return {
      progress: this.progress(project, tasks, now),
      health: this.health(project, tasks, now),
      forecast: this.forecast(project, tasks, now),
      nextMilestone: nextMilestone(project.milestones, now),
    };
  }
}

export const projectEngine = new ProjectEngine();
