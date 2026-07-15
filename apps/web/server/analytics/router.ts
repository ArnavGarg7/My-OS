import {
  compareSchema,
  forecastSchema,
  generateReportSchema,
  periodSchema,
  reviewSchema,
  trendSchema,
} from "@myos/core/analytics";
import { protectedProcedure, router } from "../trpc";
import * as service from "./service";
import * as reviews from "./reviews";
import * as reports from "./reports";
import * as summaryService from "./summary";

/**
 * Analytics API (Sprint 2.14). A read-mostly, zod-validated surface over the
 * deterministic AnalyticsEngine — per-domain metrics, scores, trends,
 * comparisons, forecasts and full period reviews. The only mutation is caching a
 * generated report.
 */
export const analyticsRouter = router({
  summary: protectedProcedure
    .input(periodSchema)
    .query(({ ctx, input }) =>
      service.summary(ctx.db, ctx.identity.preferences.timezone, input.type),
    ),
  productivity: protectedProcedure
    .input(periodSchema)
    .query(({ ctx, input }) =>
      service.productivity(ctx.db, ctx.identity.preferences.timezone, input.type),
    ),
  focus: protectedProcedure
    .input(periodSchema)
    .query(({ ctx, input }) =>
      service.focus(ctx.db, ctx.identity.preferences.timezone, input.type),
    ),
  planner: protectedProcedure.query(({ ctx }) =>
    service.planner(ctx.db, ctx.identity.preferences.timezone),
  ),
  calendar: protectedProcedure
    .input(periodSchema)
    .query(({ ctx, input }) =>
      service.calendar(ctx.db, ctx.identity.preferences.timezone, input.type),
    ),
  health: protectedProcedure.query(({ ctx }) =>
    service.health(ctx.db, ctx.identity.preferences.timezone),
  ),
  finance: protectedProcedure.query(({ ctx }) =>
    service.finance(ctx.db, ctx.identity.preferences.timezone),
  ),
  goals: protectedProcedure
    .input(periodSchema)
    .query(({ ctx, input }) =>
      service.goals(ctx.db, ctx.identity.preferences.timezone, input.type),
    ),
  projects: protectedProcedure
    .input(periodSchema)
    .query(({ ctx, input }) =>
      service.projects(ctx.db, ctx.identity.preferences.timezone, input.type),
    ),
  journal: protectedProcedure
    .input(periodSchema)
    .query(({ ctx, input }) =>
      service.journal(ctx.db, ctx.identity.preferences.timezone, input.type),
    ),
  timeline: protectedProcedure
    .input(periodSchema)
    .query(({ ctx, input }) =>
      service.timeline(ctx.db, ctx.identity.preferences.timezone, input.type),
    ),

  weeklyReview: protectedProcedure.query(({ ctx }) =>
    reviews.weeklyReview(ctx.db, ctx.identity.preferences.timezone),
  ),
  monthlyReview: protectedProcedure.query(({ ctx }) =>
    reviews.monthlyReview(ctx.db, ctx.identity.preferences.timezone),
  ),
  quarterlyReview: protectedProcedure.query(({ ctx }) =>
    reviews.quarterlyReview(ctx.db, ctx.identity.preferences.timezone),
  ),
  yearlyReview: protectedProcedure.query(({ ctx }) =>
    reviews.yearlyReview(ctx.db, ctx.identity.preferences.timezone),
  ),

  compare: protectedProcedure
    .input(compareSchema)
    .query(({ ctx, input }) =>
      service.compare(ctx.db, ctx.identity.preferences.timezone, input.period),
    ),
  forecast: protectedProcedure
    .input(forecastSchema)
    .query(({ ctx, input }) =>
      service.forecast(ctx.db, ctx.identity.preferences.timezone, input.horizonDays ?? 7),
    ),
  trend: protectedProcedure
    .input(trendSchema)
    .query(({ ctx, input }) =>
      service.trend(ctx.db, ctx.identity.preferences.timezone, input.window ?? "week"),
    ),

  statistics: protectedProcedure
    .input(periodSchema)
    .query(({ ctx, input }) =>
      service.statistics(ctx.db, ctx.identity.preferences.timezone, input.type),
    ),
  counts: protectedProcedure.query(({ ctx }) =>
    service.counts(ctx.db, ctx.identity.preferences.timezone),
  ),

  dashboard: protectedProcedure.query(({ ctx }) =>
    summaryService.dashboard(ctx.db, ctx.identity.preferences.timezone),
  ),
  statusSignal: protectedProcedure.query(({ ctx }) =>
    summaryService.statusSignal(ctx.db, ctx.identity.preferences.timezone),
  ),

  generateReport: protectedProcedure
    .input(generateReportSchema)
    .mutation(({ ctx, input }) =>
      reports.generate(ctx.db, ctx.identity.preferences.timezone, input.type),
    ),
  reports: protectedProcedure
    .input(reviewSchema.partial())
    .query(({ ctx, input }) => reports.list(ctx.db, input.type)),
});
