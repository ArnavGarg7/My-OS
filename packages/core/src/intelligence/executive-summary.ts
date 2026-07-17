import { levelForScore } from "./bands";
import { attentionItems, topAttention } from "./attention";
import { lifeBalance } from "./life-areas";
import type { ExecutiveSummary, IntelligenceInput } from "./types";

/**
 * Executive summary (Sprint 4.4). A STRUCTURED snapshot of the whole day — never generated
 * prose. Every field is an owned number lifted straight from the input or the life-area
 * rollup; the dashboard's job is to arrange them, not to write about them.
 */

export function focusLabel(focus: number): "high" | "medium" | "low" {
  if (focus >= 70) return "high";
  if (focus >= 40) return "medium";
  return "low";
}

export function executiveSummary(input: IntelligenceInput): ExecutiveSummary {
  const balance = lifeBalance(input);
  const top = topAttention(attentionItems(input));
  return {
    overall: balance.overall,
    overallLevel: levelForScore(balance.overall),
    healthScore: input.health.readiness,
    focusLabel: focusLabel(input.analytics.focus),
    plannerAccuracy: input.planner.accuracy,
    habitConsistency: input.habits.consistency,
    learning: {
      coursesActive: input.learning.coursesActive,
      flashcardsDue: input.learning.flashcardsDue,
    },
    resources: { upcomingRenewals: input.resources.upcomingRenewals },
    goals: { onTrack: input.goals.onTrack, slipping: input.goals.slipping },
    topAttention: top ? top.title : null,
  };
}
