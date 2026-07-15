import {
  blockActionSchema,
  generatePlannerSchema,
  moveBlockSchema,
  plannerDaySchema,
  plannerHistorySchema,
} from "@myos/core/planner";
import { protectedProcedure, router } from "../trpc";
import * as service from "./service";

/**
 * Planner API (Sprint 2.6). Thin, zod-validated tRPC surface over PlannerService.
 * The orchestration layer — turns Today + Task inputs into an executable plan.
 */
function prefs(ctx: {
  identity: { preferences: { preferredStartOfDay: string; preferredEndOfDay: string } };
}) {
  return {
    preferredStartOfDay: ctx.identity.preferences.preferredStartOfDay,
    preferredEndOfDay: ctx.identity.preferences.preferredEndOfDay,
  };
}

export const plannerRouter = router({
  generate: protectedProcedure
    .input(generatePlannerSchema)
    .mutation(({ ctx, input }) =>
      service.generate(ctx.db, ctx.identity.preferences.timezone, prefs(ctx), input.date),
    ),

  get: protectedProcedure
    .input(plannerDaySchema)
    .query(({ ctx, input }) =>
      service.get(ctx.db, ctx.identity.preferences.timezone, prefs(ctx), input.date),
    ),

  lock: protectedProcedure
    .input(blockActionSchema)
    .mutation(({ ctx, input }) => service.lock(ctx.db, input.id)),

  unlock: protectedProcedure
    .input(blockActionSchema)
    .mutation(({ ctx, input }) => service.unlock(ctx.db, input.id)),

  move: protectedProcedure
    .input(moveBlockSchema)
    .mutation(({ ctx, input }) => service.move(ctx.db, input.id, input.direction, input.minutes)),

  optimize: protectedProcedure
    .input(generatePlannerSchema)
    .mutation(({ ctx, input }) =>
      service.optimize(ctx.db, ctx.identity.preferences.timezone, prefs(ctx), input.date),
    ),

  clear: protectedProcedure
    .input(generatePlannerSchema)
    .mutation(({ ctx, input }) =>
      service.clear(ctx.db, ctx.identity.preferences.timezone, prefs(ctx), input.date),
    ),

  conflicts: protectedProcedure
    .input(plannerDaySchema)
    .query(({ ctx, input }) =>
      service.conflicts(ctx.db, ctx.identity.preferences.timezone, prefs(ctx), input.date),
    ),

  explain: protectedProcedure
    .input(blockActionSchema)
    .query(({ ctx, input }) =>
      service.explain(ctx.db, ctx.identity.preferences.timezone, prefs(ctx), input.id),
    ),

  history: protectedProcedure
    .input(plannerHistorySchema)
    .query(({ ctx, input }) =>
      service.history(ctx.db, ctx.identity.preferences.timezone, input.date, input.limit ?? 50),
    ),

  summary: protectedProcedure
    .input(plannerDaySchema)
    .query(({ ctx, input }) =>
      service.summary(ctx.db, ctx.identity.preferences.timezone, prefs(ctx), input.date),
    ),
});
