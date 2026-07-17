import {
  BALANCE_SPREAD_LIMIT,
  LIFE_AREAS,
  LIFE_AREA_LABELS,
  LIFE_AREA_WEIGHTS,
  type LifeArea,
} from "./constants";
import { clampScore, directionOf, levelForTrend } from "./bands";
import type { IntelligenceInput, LifeAreaView, LifeBalance } from "./types";

/**
 * Life areas (Sprint 4.4). Rolls the owned module scores up into eight high-level areas.
 *
 * Every score below is READ from `IntelligenceInput`, never recomputed — the analytics
 * ScoreBoard, health readiness, the learning score and so on all arrive already computed by
 * their owners. This module only chooses which owned number maps to which area, bands it,
 * and derives a direction from the previous value.
 */

/** Map each life area to its (current, previous) score, pulled straight from the input. */
function areaScores(
  input: IntelligenceInput,
): Record<LifeArea, { score: number; previous: number | null }> {
  const a = input.analytics;
  const prev = a.previous;
  return {
    health: { score: input.health.readiness, previous: input.health.previousReadiness },
    productivity: { score: a.productivity, previous: prev?.productivity ?? null },
    career: { score: a.goals, previous: prev?.goals ?? null },
    learning: { score: input.learning.learningScore, previous: input.learning.previousScore },
    finance: { score: a.finance, previous: prev?.finance ?? null },
    relationships: { score: relationshipsScore(input), previous: null },
    growth: { score: input.journal.growthScore, previous: null },
    wellbeing: { score: input.health.recovery, previous: null },
  };
}

/**
 * Relationships have no single owned 0–100 score, so the dashboard derives a transparent one
 * from the CRM counts the Resource platform DID compute: strong ties lift it, dormant ties
 * and overdue follow-ups pull it down. This is banding of owned counts, not a new metric.
 */
export function relationshipsScore(input: IntelligenceInput): number {
  const r = input.resources;
  const known = r.relationshipsStrong + r.relationshipsDormant;
  if (known === 0) return 50; // neutral when there is nothing to judge
  const strongShare = r.relationshipsStrong / known;
  const followUpPenalty = Math.min(20, r.followUpsDue * 5);
  return clampScore(strongShare * 100 - followUpPenalty);
}

export function lifeArea(input: IntelligenceInput, area: LifeArea): LifeAreaView {
  const { score, previous } = areaScores(input)[area];
  const current = clampScore(score);
  const direction = directionOf(current, previous);
  return {
    area,
    label: LIFE_AREA_LABELS[area],
    score: current,
    trend: direction,
    velocity: previous === null ? 0 : Math.round(current - previous),
    level: levelForTrend(current, direction),
  };
}

export function lifeAreas(input: IntelligenceInput): LifeAreaView[] {
  return LIFE_AREAS.map((area) => lifeArea(input, area));
}

/** The weighted overall life score across the eight areas. */
export function overallLifeScore(areas: LifeAreaView[]): number {
  const total = areas.reduce((sum, a) => sum + a.score * LIFE_AREA_WEIGHTS[a.area], 0);
  return clampScore(total / 100);
}

export function lifeBalance(input: IntelligenceInput): LifeBalance {
  const areas = lifeAreas(input);
  const sorted = [...areas].sort((a, b) => b.score - a.score);
  const strongest = sorted[0]!;
  const weakest = sorted[sorted.length - 1]!;
  return {
    areas,
    overall: overallLifeScore(areas),
    imbalanced: strongest.score - weakest.score > BALANCE_SPREAD_LIMIT,
    strongest: strongest.area,
    weakest: weakest.area,
  };
}

export function decliningAreas(areas: LifeAreaView[]): LifeAreaView[] {
  return areas.filter((a) => a.trend === "falling");
}

export function improvingAreas(areas: LifeAreaView[]): LifeAreaView[] {
  return areas.filter((a) => a.trend === "rising");
}
