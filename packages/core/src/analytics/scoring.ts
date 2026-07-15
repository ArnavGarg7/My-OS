import { OVERALL_WEIGHTS } from "./constants";
import { clampScore } from "./metrics";
import { computeFocus, computeProductivity } from "./productivity";
import { computePlanner } from "./planner";
import { computeHealth } from "./health";
import { computeFinance } from "./finance";
import { computeGoals } from "./goals";
import { computeJournal } from "./journal";
import type { AnalyticsContext, ScoreBoard } from "./types";
import type { TimelineEvent } from "../timeline";

/**
 * Scoring engine (Sprint 2.14). Composes the per-domain 0–100 scores into a
 * single weighted `ScoreBoard` (overall = weighted mean). Deterministic — the
 * weights live in constants so the number is reproducible and explainable.
 */
export function computeScores(
  events: TimelineEvent[],
  spanDays: number,
  ctx: Pick<AnalyticsContext, "health" | "finance" | "goals" | "planner" | "journal">,
): ScoreBoard {
  const productivity = computeProductivity(events, ctx.planner).score;
  const focus = computeFocus(events).score;
  const planner = computePlanner(ctx.planner).accuracy;
  const health = computeHealth(ctx.health).score;
  const goals = computeGoals(events, spanDays, ctx.goals).score;
  const finance = computeFinance(ctx.finance).score;
  const journal = computeJournal(events, spanDays, ctx.journal).score;

  const overall = clampScore(
    productivity * OVERALL_WEIGHTS.productivity +
      focus * OVERALL_WEIGHTS.focus +
      planner * OVERALL_WEIGHTS.planner +
      health * OVERALL_WEIGHTS.health +
      goals * OVERALL_WEIGHTS.goals +
      finance * OVERALL_WEIGHTS.finance +
      journal * OVERALL_WEIGHTS.journal,
  );

  return { productivity, focus, planner, health, goals, finance, journal, overall };
}
