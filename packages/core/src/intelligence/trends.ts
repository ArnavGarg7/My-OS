import { directionOf } from "./bands";
import type { IntelligenceInput, TrendView } from "./types";

/**
 * Trend engine (Sprint 4.4). Turns the current-vs-previous pairs the input already carries
 * into named trajectories. No derived trend value is stored, and no series is recomputed —
 * every "previous" here was computed by the owning module a period ago. Flat direction uses
 * the shared dead-band so noise does not read as movement.
 */

function trend(key: string, label: string, current: number, previous: number | null): TrendView {
  return {
    key,
    label,
    current,
    previous,
    direction: directionOf(current, previous),
    delta: previous === null ? 0 : Math.round(current - previous),
  };
}

export function trends(input: IntelligenceInput): TrendView[] {
  const a = input.analytics;
  const prev = a.previous;
  return [
    trend("overall", "Overall", a.overall, prev?.overall ?? null),
    trend("readiness", "Readiness", input.health.readiness, input.health.previousReadiness),
    trend("learning", "Learning", input.learning.learningScore, input.learning.previousScore),
    trend("productivity", "Productivity", a.productivity, prev?.productivity ?? null),
    trend("finance", "Finance", a.finance, prev?.finance ?? null),
    trend("goals", "Goal velocity", a.goals, prev?.goals ?? null),
  ];
}

export function risingTrends(views: TrendView[]): TrendView[] {
  return views.filter((t) => t.direction === "rising");
}

export function fallingTrends(views: TrendView[]): TrendView[] {
  return views.filter((t) => t.direction === "falling");
}
