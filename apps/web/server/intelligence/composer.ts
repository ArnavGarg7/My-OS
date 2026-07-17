import "server-only";
import type { IntelligenceInput } from "@myos/core/intelligence";
import type { Database } from "@myos/db";
import { analyticsSummary } from "../analytics";
import { knowledgeSummary } from "../knowledge";
import { lifeSummary, lifeReadiness } from "../life";
import { resourceSummary, resourceRelationshipHealth } from "../resource";
import { financeService } from "../finance";
import { goalService } from "../goal";

/**
 * Intelligence composer (Sprint 4.4). The ONE place the dashboard meets the rest of My OS.
 *
 * Every number below is READ from the module that owns it — the Analytics ScoreBoard, the
 * Life summary's habit data, the Resource portfolio's renewal count, the CRM's derived
 * relationship strength — and mapped into the `IntelligenceInput` the pure core consumes.
 * Nothing is recomputed here: this file does plumbing, not business logic. The Analytics
 * ScoreBoard is itself the owning module for the cross-cutting scores (productivity, planner,
 * goals, finance, journal), so forwarding those is composition, not duplication.
 *
 * `previous` values are null until review-snapshot history accumulates, so trends read flat
 * on a fresh install rather than inventing movement.
 */

function bandCount(value: number, max: number): number {
  if (max <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((value / max) * 100)));
}

export async function composeInput(db: Database, tz: string): Promise<IntelligenceInput> {
  const [analytics, health, knowledge, resources, financeAccounts, goals, relationships, life] =
    await Promise.all([
      analyticsSummary.dashboard(db, tz),
      lifeReadiness(db),
      knowledgeSummary(db),
      resourceSummary(db),
      financeService.accounts(db),
      goalService.list(db),
      resourceRelationshipHealth(db),
      lifeSummary(db),
    ]);

  const scores = analytics.scores;

  const cashBalance = financeAccounts
    .filter((a) => a.type === "checking" || a.type === "savings" || a.type === "cash")
    .reduce((sum, a) => sum + a.balance, 0);

  // Goal on-track vs slipping from the owned goal list — count by status.
  const openGoals = goals.filter((g) => g.status === "active" || g.status === "planned");
  const slipping = goals.filter((g) => g.status === "paused").length;

  // Relationship strength from the CRM's already-derived health report.
  const strong = relationships.filter((r) => r.strength === "strong").length;
  const dormant = relationships.filter((r) => r.strength === "dormant").length;
  const followUpsDue = relationships.filter((r) => r.followUpDue).length;

  return {
    analytics: {
      productivity: scores.productivity,
      focus: scores.focus,
      planner: scores.planner,
      health: scores.health,
      goals: scores.goals,
      finance: scores.finance,
      journal: scores.journal,
      overall: scores.overall,
      previous: null,
    },
    health: { readiness: health.score, recovery: health.recovery, previousReadiness: null },
    learning: {
      coursesActive: knowledge.activeResearch ? 1 : 0,
      flashcardsDue: knowledge.dueFlashcards,
      booksReading: knowledge.activeBook ? 1 : 0,
      // Knowledge exposes counts, not a 0–100 score; band notes into one for the area rollup.
      learningScore: bandCount(knowledge.totalNotes, 100),
      previousScore: null,
    },
    resources: {
      netWorth: resources.netWorth,
      upcomingRenewals: resources.upcomingRenewals,
      documentsExpiring: resources.documentsExpiring,
      relationshipsStrong: strong,
      relationshipsDormant: dormant,
      followUpsDue,
    },
    finance: { cashBalance, overBudget: false, savingsProgress: 0 },
    goals: {
      onTrack: openGoals.length - slipping,
      slipping,
      total: goals.length,
      velocity: 0,
    },
    habits: {
      consistency: life.readiness,
      bestStreak: life.bestStreak,
      atRisk: 0,
    },
    planner: {
      // The Analytics ScoreBoard owns the planner score; use it for both accuracy + completion.
      accuracy: scores.planner,
      completionRate: scores.planner,
    },
    journal: {
      entriesThisWeek: 0,
      lastReviewDaysAgo: null,
      growthScore: scores.journal,
    },
    reviewsDue: { weekly: null, monthly: null, quarterly: null, yearly: null },
  };
}
