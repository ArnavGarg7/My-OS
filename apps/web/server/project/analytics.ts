import "server-only";
import {
  assessHealth,
  calculateProgress,
  computeBurndown,
  forecast,
  type BurndownPoint,
  type Forecast,
  type HealthResult,
  type Project,
  type ProjectProgress,
} from "@myos/core/project";
import type { Task } from "@myos/core/task";
import type { Database } from "@myos/db";
import { rowToTask } from "../task/mapper";
import * as repo from "./repository";

/**
 * Project analytics (Sprint 2.8). Loads owned tasks and runs the pure derived
 * engines — progress / health / forecast / burndown. Nothing is stored; every
 * value is recomputed on read.
 */
export async function tasksFor(db: Database, projectId: string): Promise<Task[]> {
  return (await repo.tasksForProject(db, projectId)).map((r) => rowToTask(r));
}

export async function progress(
  db: Database,
  project: Project,
  now = new Date(),
): Promise<ProjectProgress> {
  return calculateProgress(project, await tasksFor(db, project.id), now);
}

export async function health(
  db: Database,
  project: Project,
  now = new Date(),
): Promise<HealthResult> {
  return assessHealth(project, await tasksFor(db, project.id), now);
}

export async function projectForecast(
  db: Database,
  project: Project,
  now = new Date(),
): Promise<Forecast> {
  return forecast(project, await tasksFor(db, project.id), now);
}

export async function burndown(
  db: Database,
  project: Project,
  now = new Date(),
): Promise<BurndownPoint[]> {
  return computeBurndown(project, await tasksFor(db, project.id), now);
}
