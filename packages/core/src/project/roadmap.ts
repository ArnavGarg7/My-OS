import { sortMilestones } from "./milestones";
import type { Project, RoadmapItem } from "./types";

/**
 * Roadmap engine (Sprint 2.8). Groups milestones into a quarter → month →
 * milestone view. Deterministic; the Planner never computes roadmap views.
 */
function quarterOf(iso: string): string {
  const d = new Date(iso);
  const q = Math.floor(d.getUTCMonth() / 3) + 1;
  return `${d.getUTCFullYear()} Q${q}`;
}

function monthOf(iso: string): string {
  return iso.slice(0, 7);
}

/** Build a flat, chronologically ordered roadmap from projects' milestones. */
export function buildRoadmap(projects: Project[]): RoadmapItem[] {
  const items: RoadmapItem[] = [];
  for (const project of projects) {
    for (const milestone of sortMilestones(project.milestones)) {
      if (!milestone.dueDate) continue;
      items.push({
        quarter: quarterOf(milestone.dueDate),
        month: monthOf(milestone.dueDate),
        projectId: project.id,
        projectName: project.name,
        milestoneId: milestone.id,
        title: milestone.title,
        dueDate: milestone.dueDate,
        completed: milestone.completed,
      });
    }
  }
  return items.sort((a, b) => a.dueDate.localeCompare(b.dueDate));
}

/** Group roadmap items by quarter (preserving chronological order). */
export function groupByQuarter(items: RoadmapItem[]): Map<string, RoadmapItem[]> {
  const map = new Map<string, RoadmapItem[]>();
  for (const item of items) {
    map.set(item.quarter, [...(map.get(item.quarter) ?? []), item]);
  }
  return map;
}
