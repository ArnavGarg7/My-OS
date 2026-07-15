import type { ComparisonPeriod, ReportType, TrendWindowKey } from "./constants";
import { computeFocus, computeProductivity } from "./productivity";
import { computeCalendar, computePlanner } from "./planner";
import { computeHealth } from "./health";
import { computeFinance } from "./finance";
import { computeGoals } from "./goals";
import { computeProjects } from "./projects";
import { computeJournal } from "./journal";
import { computeTimeline } from "./timeline";
import { computeScores } from "./scoring";
import { buildReview } from "./reviews";
import { eventVolumeTrend } from "./trends";
import { compareEventVolume } from "./comparisons";
import { forecastEventVolume } from "./forecasting";
import { periodBounds, reportSpanDays, statistics, windowEvents } from "./selectors";
import { eventsInWindow, sumMeta } from "./metrics";
import type { AnalyticsContext } from "./types";

/**
 * AnalyticsEngine (Sprint 2.14). Pure deterministic orchestration over the
 * analytics sub-engines. Analytics consumes the Timeline + domain snapshots and
 * derives everything on read — it never owns or mutates data. No AI.
 */
export class AnalyticsEngine {
  private periodEvents(ctx: AnalyticsContext, type: ReportType) {
    const { start, end } = periodBounds(type, ctx.now);
    return eventsInWindow(ctx.events, start, end);
  }

  summary(ctx: AnalyticsContext, type: ReportType = "weekly") {
    const span = reportSpanDays(type);
    const events = this.periodEvents(ctx, type);
    return {
      reportType: type,
      ...periodBounds(type, ctx.now),
      scores: computeScores(events, span, ctx),
      productivity: computeProductivity(events, ctx.planner),
      focus: computeFocus(events),
      timeline: computeTimeline(events),
    };
  }

  productivity(ctx: AnalyticsContext, type: ReportType = "weekly") {
    return computeProductivity(this.periodEvents(ctx, type), ctx.planner);
  }
  focus(ctx: AnalyticsContext, type: ReportType = "weekly") {
    return computeFocus(this.periodEvents(ctx, type));
  }
  planner(ctx: AnalyticsContext) {
    return computePlanner(ctx.planner);
  }
  calendar(ctx: AnalyticsContext, type: ReportType = "weekly") {
    const events = this.periodEvents(ctx, type);
    return computeCalendar(events, sumMeta(events, "focusMinutes"));
  }
  health(ctx: AnalyticsContext) {
    return computeHealth(ctx.health);
  }
  finance(ctx: AnalyticsContext) {
    return computeFinance(ctx.finance);
  }
  goals(ctx: AnalyticsContext, type: ReportType = "weekly") {
    return computeGoals(this.periodEvents(ctx, type), reportSpanDays(type), ctx.goals);
  }
  projects(ctx: AnalyticsContext, type: ReportType = "weekly") {
    return computeProjects(this.periodEvents(ctx, type), ctx.projects);
  }
  journal(ctx: AnalyticsContext, type: ReportType = "weekly") {
    return computeJournal(this.periodEvents(ctx, type), reportSpanDays(type), ctx.journal);
  }
  timeline(ctx: AnalyticsContext, type: ReportType = "weekly") {
    return computeTimeline(this.periodEvents(ctx, type));
  }

  review(ctx: AnalyticsContext, type: ReportType) {
    return buildReview(type, ctx);
  }

  trend(ctx: AnalyticsContext, window: TrendWindowKey = "week") {
    return eventVolumeTrend(ctx.events, window, ctx.now);
  }
  compare(ctx: AnalyticsContext, period: ComparisonPeriod) {
    return compareEventVolume(ctx.events, period, ctx.now);
  }
  forecast(ctx: AnalyticsContext, horizonDays = 7) {
    return forecastEventVolume(windowEvents(ctx.events, 30, ctx.now), horizonDays);
  }

  statistics(ctx: AnalyticsContext, type: ReportType = "weekly") {
    return statistics(ctx, reportSpanDays(type));
  }
}

export const analyticsEngine = new AnalyticsEngine();
