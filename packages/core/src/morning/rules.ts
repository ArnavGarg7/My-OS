import { minutesOfDay, timeToMinutes } from "../today";
import type { BriefingContext, Recommendation } from "./types";

/**
 * Recommendation rules (Sprint 2.2). Pure, deterministic, rule-based — NO AI.
 * The engine evaluates these in priority order and takes the first match. The
 * fallback always matches, so a recommendation is always produced.
 */
export interface RecommendationRule {
  id: string;
  priority: number;
  matches: (ctx: BriefingContext) => boolean;
  build: (ctx: BriefingContext) => Omit<Recommendation, "id">;
}

export const RECOMMENDATION_RULES: RecommendationRule[] = [
  {
    id: "before-working-hours",
    priority: 100,
    matches: (ctx) => minutesOfDay(ctx.now) < timeToMinutes(ctx.workingHours.start),
    build: () => ({
      decision: "Working hours haven't started.",
      reason: "Use this time to prepare and set your mission before the day begins.",
      confidence: 60,
    }),
  },
  {
    id: "no-mission",
    priority: 90,
    matches: (ctx) => !ctx.focus?.mission?.trim(),
    build: () => ({
      decision: "You have no mission set.",
      reason: "Define one mission to anchor everything else today.",
      confidence: 82,
    }),
  },
  {
    id: "low-energy",
    priority: 80,
    matches: (ctx) => ctx.state?.energyLevel === "low",
    build: () => ({
      decision: "Energy is low — choose lighter work.",
      reason: "Match tasks to your energy; save deep work for a stronger window.",
      confidence: 70,
    }),
  },
  {
    id: "high-interruptions",
    priority: 70,
    matches: (ctx) => (ctx.metrics?.interruptions ?? 0) > 10,
    build: () => ({
      decision: "Turn on focus mode today.",
      reason: "You've logged frequent interruptions — protect a block of deep work.",
      confidence: 68,
    }),
  },
  {
    id: "low-focus-no-schedule",
    priority: 60,
    matches: (ctx) => (ctx.state?.focusScore ?? 100) < 50 && !ctx.focus?.deepWork?.trim(),
    build: () => ({
      decision: "Focus score is low because your schedule isn't defined.",
      reason: "Add a deep-work block to lift it.",
      confidence: 60,
    }),
  },
  {
    id: "morning-not-complete",
    priority: 40,
    matches: (ctx) => !ctx.state?.morningCompleted,
    build: () => ({
      decision: "Complete your morning check-in.",
      reason: "A 30-second check-in sets the tone for the day.",
      confidence: 55,
    }),
  },
  {
    id: "all-set",
    priority: 0,
    matches: () => true,
    build: () => ({
      decision: "You're set — protect your focus and start your top priority.",
      reason: "Everything's defined. Begin deep work while your energy is high.",
      confidence: 45,
    }),
  },
];
