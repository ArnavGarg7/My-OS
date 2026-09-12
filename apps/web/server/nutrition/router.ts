import {
  logFoodSchema,
  logWaterSchema,
  logWeightSchema,
  nutritionDaySchema,
  nutritionIdSchema,
  resolveMealSchema,
  searchFoodSchema,
  setGoalsSchema,
} from "@myos/core/nutrition";
import { protectedProcedure, router } from "../trpc";
import * as service from "./service";

/**
 * Nutrition API. Resolve a meal against the food DB, log food/water/weight, manage goals, and read the
 * day view. The DB is the source of truth for macros; resolveMeal returns candidates to review.
 */
export const nutritionRouter = router({
  day: protectedProcedure
    .input(nutritionDaySchema)
    .query(({ ctx, input }) => service.day(ctx.db, input.date)),
  goals: protectedProcedure.query(({ ctx }) => service.getGoals(ctx.db)),
  weightTrend: protectedProcedure.query(({ ctx }) => service.weightTrend(ctx.db)),

  search: protectedProcedure
    .input(searchFoodSchema)
    .query(({ ctx, input }) => service.searchFood(ctx.db, input.query)),
  resolveMeal: protectedProcedure
    .input(resolveMealSchema)
    .mutation(({ ctx, input }) => service.resolveMeal(ctx.db, input)),

  logFood: protectedProcedure
    .input(logFoodSchema)
    .mutation(({ ctx, input }) => service.logFood(ctx.db, input)),
  removeFood: protectedProcedure
    .input(nutritionIdSchema)
    .mutation(({ ctx, input }) => service.removeFood(ctx.db, input.id)),
  logWater: protectedProcedure
    .input(logWaterSchema)
    .mutation(({ ctx, input }) => service.logWater(ctx.db, input)),
  logWeight: protectedProcedure
    .input(logWeightSchema)
    .mutation(({ ctx, input }) => service.logWeight(ctx.db, input)),
  setGoals: protectedProcedure
    .input(setGoalsSchema)
    .mutation(({ ctx, input }) => service.setGoals(ctx.db, input)),
});
