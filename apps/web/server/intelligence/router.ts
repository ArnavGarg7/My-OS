import "server-only";
import { z } from "zod";
import {
  collectionInputSchema,
  collectionRefSchema,
  dashboardPreferencesSchema,
  generateReportSchema,
  generateReviewSchema,
  updateCollectionSchema,
  type Collection,
  type DashboardWidget,
} from "@myos/core/intelligence";
import { protectedProcedure, router } from "../trpc";
import * as dashboardView from "./dashboard";
import * as priorities from "./priorities";
import * as reviews from "./reviews";
import * as rollups from "./rollups";
import * as service from "./service";
import * as summaryView from "./summary";
import * as trends from "./trends";

/**
 * Intelligence router (Sprint 4.4). Every procedure is protected, zod-validated and
 * deterministic. All the read endpoints derive on demand — there is no dashboard row to
 * fetch, only a dashboard to compute from read models. Only config + snapshots mutate.
 *
 * `tz` comes from the identity preferences on the context; the analytics-owned scores are
 * timezone-sensitive, so the composer needs it.
 */
const idInput = z.object({ id: z.string().uuid() });

export const intelligenceRouter = router({
  /* ── Derived reads (the AI seams) ─────────────────────────────────────── */
  dashboard: protectedProcedure.query(({ ctx }) =>
    dashboardView.dashboard(ctx.db, ctx.identity.preferences.timezone),
  ),
  summary: protectedProcedure.query(({ ctx }) =>
    summaryView.summary(ctx.db, ctx.identity.preferences.timezone),
  ),
  signals: protectedProcedure.query(({ ctx }) =>
    summaryView.signals(ctx.db, ctx.identity.preferences.timezone),
  ),
  portfolio: protectedProcedure.query(({ ctx }) =>
    summaryView.portfolio(ctx.db, ctx.identity.preferences.timezone),
  ),
  statistics: protectedProcedure.query(({ ctx }) =>
    rollups.statistics(ctx.db, ctx.identity.preferences.timezone),
  ),

  scorecards: protectedProcedure.query(({ ctx }) =>
    trends.scorecardViews(ctx.db, ctx.identity.preferences.timezone),
  ),
  trends: protectedProcedure.query(({ ctx }) =>
    trends.trends(ctx.db, ctx.identity.preferences.timezone),
  ),
  wheel: protectedProcedure.query(({ ctx }) =>
    trends.wheel(ctx.db, ctx.identity.preferences.timezone),
  ),
  lifeAreas: protectedProcedure.query(
    async ({ ctx }) =>
      (await summaryView.portfolio(ctx.db, ctx.identity.preferences.timezone)).areas,
  ),

  attention: protectedProcedure.query(({ ctx }) =>
    priorities.attention(ctx.db, ctx.identity.preferences.timezone),
  ),
  priorityMatrix: protectedProcedure.query(({ ctx }) =>
    priorities.matrix(ctx.db, ctx.identity.preferences.timezone),
  ),
  tomorrowPriorities: protectedProcedure.query(({ ctx }) =>
    priorities.tomorrow(ctx.db, ctx.identity.preferences.timezone),
  ),

  milestones: protectedProcedure.query(({ ctx }) => rollups.milestonesView(ctx.db)),
  achievements: protectedProcedure.query(({ ctx }) => rollups.achievementsView(ctx.db)),

  /* ── Dashboard config ─────────────────────────────────────────────────── */
  preferences: protectedProcedure.query(({ ctx }) => service.preferences(ctx.db)),
  savePreferences: protectedProcedure.input(dashboardPreferencesSchema).mutation(({ ctx, input }) =>
    service.savePreferences(ctx.db, {
      widgetOrder: input.widgetOrder as DashboardWidget[],
      ...(input.hiddenWidgets ? { hiddenWidgets: input.hiddenWidgets as DashboardWidget[] } : {}),
    }),
  ),

  /* ── Collections ──────────────────────────────────────────────────────── */
  listCollections: protectedProcedure.query(({ ctx }) => service.listCollections(ctx.db)),
  createCollection: protectedProcedure
    .input(collectionInputSchema)
    .mutation(({ ctx, input }) =>
      service.createCollection(ctx.db, input as { name: string } & Partial<Collection>),
    ),
  updateCollection: protectedProcedure
    .input(updateCollectionSchema)
    .mutation(({ ctx, input }) =>
      service.updateCollection(ctx.db, input.id, input as Partial<Collection>),
    ),
  addToCollection: protectedProcedure
    .input(collectionRefSchema)
    .mutation(({ ctx, input }) => service.addToCollection(ctx.db, input.id, input.ref)),
  removeFromCollection: protectedProcedure
    .input(collectionRefSchema)
    .mutation(({ ctx, input }) => service.removeFromCollection(ctx.db, input.id, input.ref)),
  deleteCollection: protectedProcedure
    .input(idInput)
    .mutation(({ ctx, input }) => service.deleteCollection(ctx.db, input.id)),

  /* ── Reviews + reports ────────────────────────────────────────────────── */
  listReviews: protectedProcedure.query(({ ctx }) => reviews.listReviews(ctx.db)),
  generateReview: protectedProcedure
    .input(generateReviewSchema)
    .mutation(({ ctx, input }) =>
      reviews.generateReview(
        ctx.db,
        ctx.identity.preferences.timezone,
        input.period,
        input.periodStart,
      ),
    ),
  listReports: protectedProcedure.query(({ ctx }) => reviews.listReports(ctx.db)),
  generateReport: protectedProcedure
    .input(generateReportSchema)
    .mutation(({ ctx, input }) =>
      reviews.generatePeriodReport(
        ctx.db,
        ctx.identity.preferences.timezone,
        input.period,
        input.format,
      ),
    ),
});
