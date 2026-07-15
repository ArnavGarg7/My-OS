import "server-only";
import {
  analyticsEngine,
  clampScore,
  countKind,
  windowEvents,
  type AnalyticsContext,
  type ComparisonPeriod,
  type ReportType,
  type TrendWindowKey,
} from "@myos/core/analytics";
import { todayInTimeZone } from "@myos/core/today";
import type { Database } from "@myos/db";
import { allEvents } from "../timeline/repository";
import { eventRowToEvent } from "../timeline/mapper";
import { buildSummary as buildHealthSummary } from "../health/summary";
import { summary as financeSummary } from "../finance/summary";
import { portfolio as goalPortfolio } from "../goal/summary";
import { signals as projectSignals } from "../project/service";
import { signals as journalSignals } from "../journal/summary";

/**
 * AnalyticsService (Sprint 2.14). Assembles the deterministic `AnalyticsContext`
 * from the immutable Timeline stream + each domain engine's existing summary /
 * portfolio / signals — Analytics never re-derives or owns their data. Every read
 * runs the pure AnalyticsEngine over this context.
 */
export async function buildContext(
  db: Database,
  tz: string,
  now = new Date(),
): Promise<AnalyticsContext> {
  const date = todayInTimeZone(tz);
  const [rows, health, finance, goals, projects, journal] = await Promise.all([
    allEvents(db),
    buildHealthSummary(db, date, now).catch(() => null),
    financeSummary(db, tz, date).catch(() => null),
    goalPortfolio(db).catch(() => null),
    projectSignals(db, now).catch(() => null),
    journalSignals(db, tz).catch(() => null),
  ]);

  const events = rows.map(eventRowToEvent);
  const win30 = windowEvents(events, 30, now);

  const ctx: AnalyticsContext = { now, timezone: tz, events };

  if (health) {
    ctx.health = {
      avgReadiness: health.readiness.score,
      avgSleepMinutes: health.sleep?.durationMinutes ?? 0,
      avgHydrationPercent: health.hydration.completionPercent,
      recoveryScore: health.recovery.score,
      workoutCount: health.workouts.count,
    };
  }
  if (finance) {
    const income = finance.cashFlow.income;
    ctx.finance = {
      totalIncome: income,
      totalExpense: finance.cashFlow.expenses,
      budgetAdherence: Math.max(0, 100 - finance.overallBudgetPercent),
      savingsRate: income > 0 ? clampScore((finance.cashFlow.net / income) * 100) : 0,
      subscriptionCost: finance.subscriptions.monthlyRecurring,
    };
  }
  if (goals) {
    ctx.goals = {
      activeCount: goals.activeCount,
      overallProgress: goals.overallProgress,
      objectivesCompleted: countKind(win30, "objective.completed"),
      habitConsistency: Math.min(100, goals.habitStreak * 20),
      completionRate:
        goals.activeCount > 0
          ? clampScore(((goals.activeCount - goals.behindCount) / goals.activeCount) * 100)
          : 0,
      forecastAccuracy: 0,
    };
  }
  ctx.projects = {
    completed: countKind(win30, "project.completed"),
    milestonesCompleted: countKind(win30, "milestone.completed"),
    atRisk: projects?.atRiskCount ?? 0,
    velocity: Math.round((countKind(win30, "task.completed") / (30 / 7)) * 10) / 10,
  };
  ctx.journal = {
    writingStreak: journal?.writingStreak ?? 0,
    wordCount: 0,
    reflectionCount: countKind(win30, "reflection.completed"),
    moodTrend: 3,
    gratitudeCount: countKind(win30, "gratitude.logged"),
  };

  return ctx;
}

// --- read endpoints (all derive from the context) ---
export async function summary(db: Database, tz: string, type: ReportType = "weekly") {
  return analyticsEngine.summary(await buildContext(db, tz), type);
}
export async function productivity(db: Database, tz: string, type: ReportType = "weekly") {
  return analyticsEngine.productivity(await buildContext(db, tz), type);
}
export async function focus(db: Database, tz: string, type: ReportType = "weekly") {
  return analyticsEngine.focus(await buildContext(db, tz), type);
}
export async function planner(db: Database, tz: string) {
  return analyticsEngine.planner(await buildContext(db, tz));
}
export async function calendar(db: Database, tz: string, type: ReportType = "weekly") {
  return analyticsEngine.calendar(await buildContext(db, tz), type);
}
export async function health(db: Database, tz: string) {
  return analyticsEngine.health(await buildContext(db, tz));
}
export async function finance(db: Database, tz: string) {
  return analyticsEngine.finance(await buildContext(db, tz));
}
export async function goals(db: Database, tz: string, type: ReportType = "weekly") {
  return analyticsEngine.goals(await buildContext(db, tz), type);
}
export async function projects(db: Database, tz: string, type: ReportType = "weekly") {
  return analyticsEngine.projects(await buildContext(db, tz), type);
}
export async function journal(db: Database, tz: string, type: ReportType = "weekly") {
  return analyticsEngine.journal(await buildContext(db, tz), type);
}
export async function timeline(db: Database, tz: string, type: ReportType = "weekly") {
  return analyticsEngine.timeline(await buildContext(db, tz), type);
}
export async function trend(db: Database, tz: string, window: TrendWindowKey = "week") {
  return analyticsEngine.trend(await buildContext(db, tz), window);
}
export async function compare(db: Database, tz: string, period: ComparisonPeriod) {
  return analyticsEngine.compare(await buildContext(db, tz), period);
}
export async function forecast(db: Database, tz: string, horizonDays = 7) {
  return analyticsEngine.forecast(await buildContext(db, tz), horizonDays);
}
export async function statistics(db: Database, tz: string, type: ReportType = "weekly") {
  return analyticsEngine.statistics(await buildContext(db, tz), type);
}
export async function counts(db: Database, tz: string) {
  const s = analyticsEngine.statistics(await buildContext(db, tz), "weekly");
  return { totalEvents: s.totalEvents, activeDays: s.activeDays, overallScore: s.overallScore };
}
