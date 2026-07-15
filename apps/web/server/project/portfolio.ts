import "server-only";
import {
  buildRoadmap,
  summarize,
  type PortfolioSummary,
  type Project,
  type RoadmapItem,
} from "@myos/core/project";
import type { Task } from "@myos/core/task";
import type { Database } from "@myos/db";
import { rowToTask } from "../task/mapper";
import * as repo from "./repository";

/**
 * Portfolio + roadmap aggregation (Sprint 2.8). Runs the pure portfolio/roadmap
 * engines over every hydrated project and its tasks. Equal weighting across
 * projects; deterministic.
 */
export async function portfolioSummary(
  db: Database,
  projects: Project[],
  now = new Date(),
): Promise<PortfolioSummary> {
  const tasks: Task[] = (await repo.listTasks(db)).map((r) => rowToTask(r));
  return summarize(projects, tasks, now);
}

export function roadmap(projects: Project[]): RoadmapItem[] {
  return buildRoadmap(projects);
}
