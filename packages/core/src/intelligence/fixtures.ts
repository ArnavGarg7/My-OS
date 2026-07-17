import { createIntelligenceEngine } from "./engine";
import type { AchievementInput } from "./achievements";
import type { MilestoneInput } from "./milestones";
import type { Collection, IntelligenceInput, ScoreBoardLike } from "./types";
import type { ReviewPeriod } from "./constants";

/**
 * Intelligence test fixtures (Sprint 4.4). A FIXED clock and a healthy baseline input, so the
 * composition tests are reproducible. Spread over `makeInput` to move one owned number at a
 * time and watch the derived views respond.
 */

export const FIXED_NOW = new Date("2026-07-17T09:00:00.000Z");

let counter = 0;
export function testEngine() {
  counter = 0;
  return createIntelligenceEngine({
    newId: () => `id-${++counter}`,
    now: () => FIXED_NOW,
  });
}

export function makeScoreBoard(over: Partial<ScoreBoardLike> = {}): ScoreBoardLike {
  return {
    productivity: 75,
    focus: 70,
    planner: 80,
    health: 78,
    goals: 72,
    finance: 68,
    journal: 65,
    overall: 73,
    ...over,
  };
}

/** A balanced, healthy baseline. Every field is an "already computed" owned number. */
export function makeInput(over: Partial<IntelligenceInput> = {}): IntelligenceInput {
  return {
    analytics: {
      productivity: 75,
      focus: 70,
      planner: 80,
      health: 78,
      goals: 72,
      finance: 68,
      journal: 65,
      overall: 73,
      previous: makeScoreBoard(),
      ...over.analytics,
    },
    health: { readiness: 78, recovery: 74, previousReadiness: 76, ...over.health },
    learning: {
      coursesActive: 3,
      flashcardsDue: 5,
      booksReading: 2,
      learningScore: 70,
      previousScore: 68,
      ...over.learning,
    },
    resources: {
      netWorth: 500_000,
      upcomingRenewals: 0,
      documentsExpiring: 0,
      relationshipsStrong: 4,
      relationshipsDormant: 2,
      followUpsDue: 0,
      ...over.resources,
    },
    finance: { cashBalance: 100_000, overBudget: false, savingsProgress: 60, ...over.finance },
    goals: { onTrack: 4, slipping: 0, total: 5, velocity: 3, ...over.goals },
    habits: { consistency: 82, bestStreak: 21, atRisk: 0, ...over.habits },
    planner: { accuracy: 88, completionRate: 85, ...over.planner },
    journal: { entriesThisWeek: 4, lastReviewDaysAgo: 3, growthScore: 70, ...over.journal },
    reviewsDue: { weekly: 3, monthly: 10, quarterly: 40, yearly: 120, ...over.reviewsDue },
  };
}

/** An input with several things wrong — for the attention/signal tests. */
export function makeTroubledInput(): IntelligenceInput {
  return makeInput({
    analytics: {
      productivity: 40,
      focus: 30,
      planner: 45,
      health: 38,
      goals: 35,
      finance: 30,
      journal: 40,
      overall: 38,
      previous: makeScoreBoard({ productivity: 60, finance: 55, goals: 55, overall: 58 }),
    },
    health: { readiness: 35, recovery: 40, previousReadiness: 55 },
    goals: { onTrack: 1, slipping: 3, total: 5, velocity: -4 },
    habits: { consistency: 45, bestStreak: 3, atRisk: 2 },
    resources: {
      netWorth: 100_000,
      upcomingRenewals: 2,
      documentsExpiring: 1,
      relationshipsStrong: 1,
      relationshipsDormant: 5,
      followUpsDue: 3,
    },
    finance: { cashBalance: 5_000, overBudget: true, savingsProgress: 15 },
    reviewsDue: { weekly: 12, monthly: 45, quarterly: 100, yearly: 400 },
  });
}

export function makeMilestone(over: Partial<MilestoneInput> = {}): MilestoneInput {
  return {
    id: "ms-1",
    title: "Ship v2",
    source: "goal",
    date: "2026-08-01",
    completedAt: null,
    ...over,
  };
}

export function makeAchievementInput(over: Partial<AchievementInput> = {}): AchievementInput {
  return {
    workoutsTotal: 40,
    booksFinished: 12,
    longestStreakDays: 45,
    investmentsCount: 1,
    goalsCompleted: 3,
    reviewsCompleted: 6,
    notesTotal: 80,
    focusHoursTotal: 60,
    ...over,
  };
}

export function makeCollection(over: Partial<Collection> = {}): Collection {
  return {
    id: "col-1",
    name: "Semester",
    entityRefs: [{ module: "goal", id: "g1" }],
    createdAt: "2026-07-01T09:00:00.000Z",
    updatedAt: "2026-07-01T09:00:00.000Z",
    ...over,
  };
}

export const ALL_PERIODS: ReviewPeriod[] = ["weekly", "monthly", "quarterly", "yearly"];
