import type { ReportType } from "./constants";
import { computeFocus, computeProductivity } from "./productivity";
import { computeTimeline } from "./timeline";
import { computeScores } from "./scoring";
import { periodBounds, reportSpanDays } from "./selectors";
import { eventsInWindow, metaNumber, peakDay } from "./metrics";
import type { AnalyticsContext, Review } from "./types";
import type { TimelineEvent } from "../timeline";

/**
 * Review engine (Sprint 2.14). Deterministically assembles a full period review
 * (weekly/monthly/quarterly/yearly) from the analytics context — scores, core
 * metrics, highlights, and rule-derived achievements / bottlenecks / risks. No
 * AI summaries — every line is computed from the data.
 */
function largestExpense(events: TimelineEvent[]): number {
  let max = 0;
  for (const e of events) {
    if (e.eventType !== "finance.transaction") continue;
    if (e.metadata["direction"] === "income") continue;
    const amount = metaNumber(e, "amount");
    if (amount !== null) max = Math.max(max, Math.abs(amount));
  }
  return Math.round(max * 100) / 100;
}

function habitTallies(events: TimelineEvent[]): Map<string, number> {
  const tally = new Map<string, number>();
  for (const e of events) {
    if (e.eventType !== "habit.completed") continue;
    const name = e.title;
    tally.set(name, (tally.get(name) ?? 0) + 1);
  }
  return tally;
}

function bestWorstHabit(events: TimelineEvent[]): { best: string | null; worst: string | null } {
  const tally = habitTallies(events);
  if (tally.size === 0) return { best: null, worst: null };
  const sorted = [...tally.entries()].sort((a, b) => b[1] - a[1]);
  return { best: sorted[0]![0], worst: sorted[sorted.length - 1]![0] };
}

function longestFocus(events: TimelineEvent[]): number {
  return events.reduce((max, e) => Math.max(max, metaNumber(e, "focusMinutes") ?? 0), 0);
}

function topDecision(events: TimelineEvent[]): string | null {
  const decisions = events
    .filter((e) => e.eventType === "decision.accepted")
    .sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1));
  return decisions[0]?.title ?? null;
}

export function buildReview(type: ReportType, ctx: AnalyticsContext): Review {
  const span = reportSpanDays(type);
  const { start, end } = periodBounds(type, ctx.now);
  const events = eventsInWindow(ctx.events, start, end);

  const productivity = computeProductivity(events, ctx.planner);
  const focus = computeFocus(events);
  const timeline = computeTimeline(events);
  const scores = computeScores(events, span, ctx);
  const { best, worst } = bestWorstHabit(events);

  const achievements: string[] = [];
  if (productivity.tasksCompleted > 0)
    achievements.push(`Completed ${productivity.tasksCompleted} tasks`);
  if (ctx.projects?.completed) achievements.push(`Finished ${ctx.projects.completed} projects`);
  if (ctx.goals?.objectivesCompleted)
    achievements.push(`Completed ${ctx.goals.objectivesCompleted} objectives`);
  if (scores.overall >= 85) achievements.push(`Overall score ${scores.overall} — excellent`);

  const bottlenecks: string[] = [];
  if (productivity.contextSwitches > 10) bottlenecks.push("High context switching");
  if (scores.planner < 60) bottlenecks.push("Planner accuracy below target");
  if (ctx.health && ctx.health.avgReadiness < 60) bottlenecks.push("Low average readiness");
  if (focus.deepWorkMinutes === 0) bottlenecks.push("No deep-work blocks logged");

  const upcomingRisks: string[] = [];
  if (ctx.projects?.atRisk) upcomingRisks.push(`${ctx.projects.atRisk} projects at risk`);
  if (ctx.finance && ctx.finance.budgetAdherence < 70)
    upcomingRisks.push("Budget adherence slipping");
  if (ctx.goals && ctx.goals.completionRate < 40) upcomingRisks.push("Goal completion behind pace");

  return {
    reportType: type,
    periodStart: start,
    periodEnd: end,
    scores,
    productivity,
    focus,
    timeline,
    highlights: {
      mostProductiveDay: peakDay(events),
      longestFocusMinutes: longestFocus(events),
      largestExpense: largestExpense(events),
      bestHabit: best,
      worstHabit: worst,
      topDecision: topDecision(events),
    },
    achievements,
    bottlenecks,
    upcomingRisks,
  };
}
