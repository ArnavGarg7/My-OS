import "server-only";
import { analyticsEngine, eventVolumeTrend, kindTrend } from "@myos/core/analytics";
import type { Database } from "@myos/db";
import * as service from "./service";
import { buildContext } from "./service";

/**
 * Analytics summary facade (Sprint 2.14). A thin surface the Morning slot +
 * status bar consume: a compact scoreboard + trend snapshot without pulling a
 * full review. Derives from the same deterministic context.
 */
export async function dashboard(db: Database, tz: string) {
  const [weekly, trend] = await Promise.all([
    service.summary(db, tz, "weekly"),
    service.trend(db, tz, "week"),
  ]);
  return {
    scores: weekly.scores,
    productivity: weekly.productivity.score,
    trend: { direction: trend.direction, changePercent: trend.changePercent },
    periodStart: weekly.start,
    periodEnd: weekly.end,
  };
}

/** Status-bar signal: productivity score + weekly trend %. */
export async function statusSignal(db: Database, tz: string) {
  const d = await dashboard(db, tz);
  return {
    productivity: d.productivity,
    overall: d.scores.overall,
    trendDirection: d.trend.direction,
    trendPercent: d.trend.changePercent,
  };
}

/**
 * Deterministic analytics signals for the Decision engine (Sprint 2.14). Derived
 * from weekly-vs-prior trends + the planner/goal metrics.
 */
export async function signals(db: Database, tz: string) {
  const ctx = await buildContext(db, tz);
  const productivityTrend = eventVolumeTrend(ctx.events, "week", ctx.now);
  const plannerTrend = kindTrend(ctx.events, "planner.accepted", "month", ctx.now);
  const goalTrend = kindTrend(ctx.events, "habit.completed", "month", ctx.now);
  const calendar = analyticsEngine.calendar(ctx, "weekly");
  return {
    plannerAccuracyFalling: plannerTrend.direction === "down",
    goalVelocityDeclining: goalTrend.direction === "down",
    productivityTrendFalling: productivityTrend.direction === "down",
    meetingHeavy: calendar.meetingRatio >= 50,
  };
}
