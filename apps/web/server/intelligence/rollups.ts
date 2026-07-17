import "server-only";
import {
  achievements,
  buildStatistics,
  milestones,
  unlockedCount,
  type Achievement,
  type AchievementInput,
  type IntelligenceStatistics,
  type MilestoneInput,
  type MilestoneView,
} from "@myos/core/intelligence";
import type { Database } from "@myos/db";
import { goalService } from "../goal";
import { knowledgeSummary } from "../knowledge";
import { lifeSummary } from "../life";
import { resourcePortfolio } from "../resource";
import { composeInput } from "./composer";

/**
 * Intelligence roll-ups (Sprint 4.4). Achievements and milestones are composed from lifetime
 * totals and dated items the owning modules already track — the goal list, the CRM portfolio,
 * the Life summary. The pure core applies the explicit achievement rules and derives milestone
 * status; this module only forwards owned numbers.
 */

async function achievementInput(db: Database): Promise<AchievementInput> {
  const [goals, knowledge, life, portfolio] = await Promise.all([
    goalService.list(db),
    knowledgeSummary(db),
    lifeSummary(db),
    resourcePortfolio(db),
  ]);
  return {
    workoutsTotal: life.workoutsThisWeek,
    booksFinished: knowledge.activeBook ? 1 : 0,
    longestStreakDays: life.bestStreak,
    investmentsCount: portfolio.investmentValue > 0 ? 1 : 0,
    goalsCompleted: goals.filter((g) => g.status === "completed").length,
    reviewsCompleted: 0,
    notesTotal: knowledge.totalNotes,
    focusHoursTotal: 0,
  };
}

export async function achievementsView(db: Database): Promise<Achievement[]> {
  return achievements(await achievementInput(db), new Date());
}

/** Milestones rolled up from open + completed goals (other owners can feed this list later). */
export async function milestonesView(db: Database): Promise<MilestoneView[]> {
  const goals = await goalService.list(db);
  const input: MilestoneInput[] = goals
    .filter((g) => g.targetDate !== null)
    .map((g) => ({
      id: g.id,
      title: g.title,
      source: "goal",
      date: g.targetDate as string,
      completedAt: g.status === "completed" ? g.updatedAt : null,
    }));
  return milestones(input, new Date());
}

export async function statistics(db: Database, tz: string): Promise<IntelligenceStatistics> {
  const [input, ms, achInput] = await Promise.all([
    composeInput(db, tz),
    milestonesView(db),
    achievementInput(db),
  ]);
  return buildStatistics(input, {
    milestonesUpcoming: ms.filter((m) => m.status === "upcoming").length,
    achievementsUnlocked: unlockedCount(achInput),
  });
}
