import {
  finishWorkoutSchema,
  logMealSchema,
  logSleepSchema,
  logWaterSchema,
  logWorkoutSchema,
  rangeSchema,
  trendsSchema,
  updateEnergySchema,
  updateMoodSchema,
  updateWeightSchema,
} from "@myos/core/health";
import { protectedProcedure, router } from "../trpc";
import * as service from "./service";

/**
 * Health API (Sprint 2.9). Thin, zod-validated tRPC surface over HealthService.
 * The date defaults to the user's timezone-local today when omitted.
 */
function tz(ctx: { identity: { preferences: { timezone: string } } }): string {
  return ctx.identity.preferences.timezone;
}

export const healthRouter = router({
  summary: protectedProcedure
    .input(rangeSchema)
    .query(({ ctx, input }) => service.summary(ctx.db, tz(ctx), input.date)),

  daily: protectedProcedure
    .input(rangeSchema)
    .query(({ ctx, input }) => service.daily(ctx.db, tz(ctx), input.date)),

  sleep: protectedProcedure.query(({ ctx }) => service.sleep(ctx.db)),

  workouts: protectedProcedure
    .input(rangeSchema)
    .query(({ ctx, input }) => service.workoutList(ctx.db, tz(ctx), input.date)),

  hydration: protectedProcedure
    .input(rangeSchema)
    .query(({ ctx, input }) => service.hydration(ctx.db, tz(ctx), input.date)),

  nutrition: protectedProcedure
    .input(rangeSchema)
    .query(({ ctx, input }) => service.nutrition(ctx.db, tz(ctx), input.date)),

  body: protectedProcedure.query(({ ctx }) => service.body(ctx.db)),

  readiness: protectedProcedure
    .input(rangeSchema)
    .query(({ ctx, input }) => service.readiness(ctx.db, tz(ctx), input.date)),

  energy: protectedProcedure
    .input(rangeSchema)
    .query(({ ctx, input }) => service.energy(ctx.db, tz(ctx), input.date)),

  recovery: protectedProcedure
    .input(rangeSchema)
    .query(({ ctx, input }) => service.recovery(ctx.db, tz(ctx), input.date)),

  signals: protectedProcedure
    .input(rangeSchema)
    .query(({ ctx, input }) => service.signals(ctx.db, tz(ctx), input.date)),

  trends: protectedProcedure
    .input(trendsSchema)
    .query(({ ctx, input }) => service.trends(ctx.db, input.days)),

  history: protectedProcedure
    .input(trendsSchema)
    .query(({ ctx, input }) => service.history(ctx.db, input.days)),

  logWater: protectedProcedure
    .input(logWaterSchema)
    .mutation(({ ctx, input }) => service.logWater(ctx.db, tz(ctx), input)),

  logMeal: protectedProcedure
    .input(logMealSchema)
    .mutation(({ ctx, input }) => service.logMeal(ctx.db, tz(ctx), input)),

  logWorkout: protectedProcedure
    .input(logWorkoutSchema)
    .mutation(({ ctx, input }) => service.logWorkout(ctx.db, tz(ctx), input)),

  finishWorkout: protectedProcedure
    .input(finishWorkoutSchema)
    .mutation(({ ctx, input }) => service.finishWorkout(ctx.db, tz(ctx), input.id, input.endedAt)),

  logSleep: protectedProcedure
    .input(logSleepSchema)
    .mutation(({ ctx, input }) => service.logSleep(ctx.db, tz(ctx), input)),

  updateWeight: protectedProcedure
    .input(updateWeightSchema)
    .mutation(({ ctx, input }) => service.updateWeight(ctx.db, tz(ctx), input)),

  updateEnergy: protectedProcedure
    .input(updateEnergySchema)
    .mutation(({ ctx, input }) =>
      service.updateEnergy(ctx.db, tz(ctx), input.energyLevel, input.date),
    ),

  updateMood: protectedProcedure
    .input(updateMoodSchema)
    .mutation(({ ctx, input }) =>
      service.updateMood(ctx.db, tz(ctx), input.mood, input.stress, input.date),
    ),
});
