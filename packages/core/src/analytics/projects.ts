import { countKind, round } from "./metrics";
import type { ProjectAnalyticsInput } from "./types";
import type { TimelineEvent } from "../timeline";

/**
 * Project analytics (Sprint 2.14). Completion + milestone throughput from the
 * Timeline, at-risk count + velocity from the Project engine's portfolio, and a
 * simple burndown trend. Deterministic.
 */
export interface ProjectMetrics {
  projectsCompleted: number;
  milestonesCompleted: number;
  atRisk: number;
  velocity: number; // tasks/week
  burndownTrend: "improving" | "flat" | "worsening";
}

export function computeProjects(
  events: TimelineEvent[],
  input?: ProjectAnalyticsInput,
): ProjectMetrics {
  const p = input ?? { completed: 0, milestonesCompleted: 0, atRisk: 0, velocity: 0 };
  const projectsCompleted = p.completed || countKind(events, "project.completed");
  const milestonesCompleted = p.milestonesCompleted || countKind(events, "milestone.completed");

  const burndownTrend: ProjectMetrics["burndownTrend"] =
    p.atRisk === 0 ? "improving" : p.atRisk <= 1 ? "flat" : "worsening";

  return {
    projectsCompleted,
    milestonesCompleted,
    atRisk: p.atRisk,
    velocity: round(p.velocity, 1),
    burndownTrend,
  };
}
