import "server-only";
import {
  editPreferenceSchema,
  reviewRangeSchema,
  setPolicySchema,
  submitFeedbackSchema,
} from "@myos/core/adaptation";
import { protectedProcedure, router } from "../trpc";
import * as service from "./service";

/**
 * Adaptation router (Sprint 6.5, Phase 6 finale). The Adaptive Personal Intelligence surface: inspect
 * the learned Personal Profile / preferences / habits / routines / insights / analytics, submit
 * recommendation feedback, edit or disable any learned preference, generate weekly/monthly reviews,
 * and govern per-category learning policies. Every value is confidence-scored + evidence-backed; the
 * user can inspect, edit, approve or disable everything. No AI writes anything here.
 */
export const adaptationRouter = router({
  profile: protectedProcedure.query(({ ctx }) => service.profile(ctx.db)),
  preferences: protectedProcedure.query(({ ctx }) => service.preferences(ctx.db)),
  habits: protectedProcedure.query(({ ctx }) => service.habits(ctx.db)),
  routines: protectedProcedure.query(({ ctx }) => service.routines(ctx.db)),
  insights: protectedProcedure.query(({ ctx }) => service.insights(ctx.db)),
  analytics: protectedProcedure.query(({ ctx }) => service.analytics(ctx.db)),
  feedback: protectedProcedure.query(({ ctx }) => service.feedbackOverview(ctx.db)),
  timeline: protectedProcedure.query(({ ctx }) => service.timeline(ctx.db)),
  settings: protectedProcedure.query(({ ctx }) => service.settings(ctx.db)),
  forChief: protectedProcedure.query(({ ctx }) => service.forChief(ctx.db)),
  /** Estimate-vs-reality: how the user's estimates compare to recorded actuals. */
  estimation: protectedProcedure.query(({ ctx }) => service.estimation(ctx.db)),
  /** Adaptive planning: is today's plan realistic given real capacity + history? */
  todayPlan: protectedProcedure.query(({ ctx }) =>
    service.todayPlan(ctx.db, ctx.identity.preferences.timezone, {
      preferredStartOfDay: ctx.identity.preferences.preferredStartOfDay,
      preferredEndOfDay: ctx.identity.preferences.preferredEndOfDay,
    }),
  ),

  submitFeedback: protectedProcedure
    .input(submitFeedbackSchema)
    .mutation(({ ctx, input }) =>
      service.submitFeedback(ctx.db, input.proposalId, input.subject, input.type),
    ),
  editPreference: protectedProcedure.input(editPreferenceSchema).mutation(({ ctx, input }) =>
    service.editPreference(ctx.db, input.key, {
      ...(input.value !== undefined ? { value: input.value } : {}),
      ...(input.enabled !== undefined ? { enabled: input.enabled } : {}),
    }),
  ),
  setPolicy: protectedProcedure
    .input(setPolicySchema)
    .mutation(({ ctx, input }) => service.setPolicy(ctx.db, input.category, input.mode)),
  weeklyReview: protectedProcedure
    .input(reviewRangeSchema.partial().optional())
    .query(({ ctx, input }) => service.weeklyReview(ctx.db, input?.periodStart, input?.periodEnd)),
  monthlyReview: protectedProcedure
    .input(reviewRangeSchema.partial().optional())
    .query(({ ctx, input }) => service.monthlyReview(ctx.db, input?.periodStart, input?.periodEnd)),
});
