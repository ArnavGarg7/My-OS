import {
  completeHabitSchema,
  createGoalSchema,
  createHabitSchema,
  createKeyResultSchema,
  createObjectiveSchema,
  createReviewSchema,
  goalActionSchema,
  goalLinkSchema,
  listGoalsSchema,
  searchGoalsSchema,
  updateGoalSchema,
  updateKeyResultSchema,
} from "@myos/core/goal";
import { z } from "zod";
import { protectedProcedure, router } from "../trpc";
import * as service from "./service";
import * as summaryService from "./summary";

/**
 * Goal API (Sprint 2.12). Thin, zod-validated tRPC surface over GoalService —
 * the strategic layer measuring life outcomes.
 */
export const goalRouter = router({
  list: protectedProcedure
    .input(listGoalsSchema)
    .query(({ ctx, input }) => service.list(ctx.db, input.status)),
  get: protectedProcedure
    .input(goalActionSchema)
    .query(({ ctx, input }) => service.get(ctx.db, input.id)),
  create: protectedProcedure
    .input(createGoalSchema)
    .mutation(({ ctx, input }) => service.create(ctx.db, input)),
  update: protectedProcedure
    .input(updateGoalSchema)
    .mutation(({ ctx, input }) => service.update(ctx.db, input)),
  archive: protectedProcedure
    .input(goalActionSchema)
    .mutation(({ ctx, input }) => service.archive(ctx.db, input.id)),

  objectives: protectedProcedure
    .input(z.object({ goalId: z.string().uuid() }))
    .query(({ ctx, input }) => service.objectives(ctx.db, input.goalId)),
  createObjective: protectedProcedure
    .input(createObjectiveSchema)
    .mutation(({ ctx, input }) => service.createObjective(ctx.db, input)),
  createKeyResult: protectedProcedure
    .input(createKeyResultSchema)
    .mutation(({ ctx, input }) => service.createKeyResult(ctx.db, input)),
  updateKeyResult: protectedProcedure
    .input(updateKeyResultSchema)
    .mutation(({ ctx, input }) => service.updateKeyResultValue(ctx.db, input)),

  habits: protectedProcedure.query(({ ctx }) => service.habits(ctx.db)),
  createHabit: protectedProcedure
    .input(createHabitSchema)
    .mutation(({ ctx, input }) => service.createHabit(ctx.db, input)),
  completeHabit: protectedProcedure
    .input(completeHabitSchema)
    .mutation(({ ctx, input }) =>
      service.completeHabit(ctx.db, input, ctx.identity.preferences.timezone),
    ),

  reviews: protectedProcedure
    .input(z.object({ goalId: z.string().uuid() }))
    .query(({ ctx, input }) => service.reviews(ctx.db, input.goalId)),
  createReview: protectedProcedure
    .input(createReviewSchema)
    .mutation(({ ctx, input }) => service.createGoalReview(ctx.db, input)),

  addLink: protectedProcedure
    .input(goalLinkSchema)
    .mutation(({ ctx, input }) => service.addLink(ctx.db, input)),

  summary: protectedProcedure
    .input(goalActionSchema)
    .query(({ ctx, input }) => summaryService.summary(ctx.db, input.id)),
  progress: protectedProcedure
    .input(goalActionSchema)
    .query(({ ctx, input }) => summaryService.progress(ctx.db, input.id)),
  forecast: protectedProcedure
    .input(goalActionSchema)
    .query(({ ctx, input }) => summaryService.forecast(ctx.db, input.id)),
  portfolio: protectedProcedure.query(({ ctx }) => summaryService.portfolio(ctx.db)),
  signals: protectedProcedure.query(({ ctx }) => summaryService.signals(ctx.db)),
  counts: protectedProcedure.query(({ ctx }) => summaryService.counts(ctx.db)),
  search: protectedProcedure
    .input(searchGoalsSchema)
    .query(({ ctx, input }) => summaryService.search(ctx.db, input.query)),
});
