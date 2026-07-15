import {
  addNoteSchema,
  daySelectorSchema,
  decisionHistorySchema,
  listNotesSchema,
  updateFocusSchema,
  updateMetricsSchema,
  updateStateSchema,
} from "@myos/core/today";
import {
  decisionActionSchema,
  deferDecisionSchema,
  listDecisionsSchema,
} from "@myos/core/decision";
import { protectedProcedure, router } from "../trpc";
import * as service from "./service";
import * as decisionService from "../decision/service";

/**
 * Today API (Sprint 2.1). Thin, zod-validated tRPC surface over TodayService.
 * "today" resolves from the authenticated user's timezone.
 */
export const todayRouter = router({
  getState: protectedProcedure
    .input(daySelectorSchema)
    .query(({ ctx, input }) =>
      service.getState(ctx.db, ctx.identity.preferences.timezone, input.date),
    ),

  updateState: protectedProcedure
    .input(updateStateSchema)
    .mutation(({ ctx, input }) =>
      service.updateState(ctx.db, ctx.identity.preferences.timezone, input),
    ),

  getFocus: protectedProcedure
    .input(daySelectorSchema)
    .query(({ ctx, input }) =>
      service.getFocus(ctx.db, ctx.identity.preferences.timezone, input.date),
    ),

  updateFocus: protectedProcedure
    .input(updateFocusSchema)
    .mutation(({ ctx, input }) =>
      service.updateFocus(ctx.db, ctx.identity.preferences.timezone, input),
    ),

  getMetrics: protectedProcedure
    .input(daySelectorSchema)
    .query(({ ctx, input }) =>
      service.getMetrics(ctx.db, ctx.identity.preferences.timezone, input.date),
    ),

  updateMetrics: protectedProcedure
    .input(updateMetricsSchema)
    .mutation(({ ctx, input }) =>
      service.updateMetrics(ctx.db, ctx.identity.preferences.timezone, input),
    ),

  addNote: protectedProcedure
    .input(addNoteSchema)
    .mutation(({ ctx, input }) =>
      service.addNote(ctx.db, ctx.identity.preferences.timezone, input),
    ),

  listNotes: protectedProcedure
    .input(listNotesSchema)
    .query(({ ctx, input }) =>
      service.listNotes(ctx.db, ctx.identity.preferences.timezone, input.date),
    ),

  getDecisionHistory: protectedProcedure
    .input(decisionHistorySchema)
    .query(({ ctx, input }) =>
      service.getDecisionHistory(ctx.db, ctx.identity.preferences.timezone, input),
    ),

  completeMorning: protectedProcedure
    .input(daySelectorSchema)
    .mutation(({ ctx, input }) =>
      service.completeMorning(ctx.db, ctx.identity.preferences.timezone, input.date),
    ),

  logRecommendation: protectedProcedure.mutation(({ ctx }) =>
    service.logRecommendation(ctx.db, ctx.identity.preferences.timezone, {
      displayName: ctx.identity.preferences.displayName,
      preferredStartOfDay: ctx.identity.preferences.preferredStartOfDay,
      preferredEndOfDay: ctx.identity.preferences.preferredEndOfDay,
    }),
  ),

  // --- Decision engine (Sprint 2.3) ---
  generateDecision: protectedProcedure.mutation(({ ctx }) =>
    decisionService.generate(ctx.db, ctx.identity.preferences.timezone, {
      preferredStartOfDay: ctx.identity.preferences.preferredStartOfDay,
      preferredEndOfDay: ctx.identity.preferences.preferredEndOfDay,
    }),
  ),

  acceptDecision: protectedProcedure
    .input(decisionActionSchema)
    .mutation(({ ctx, input }) => decisionService.accept(ctx.db, input.id)),

  dismissDecision: protectedProcedure
    .input(decisionActionSchema)
    .mutation(({ ctx, input }) => decisionService.dismiss(ctx.db, input.id)),

  deferDecision: protectedProcedure
    .input(deferDecisionSchema)
    .mutation(({ ctx, input }) =>
      decisionService.defer(ctx.db, input.id, input.option, input.customUntil),
    ),

  completeDecision: protectedProcedure
    .input(decisionActionSchema)
    .mutation(({ ctx, input }) => decisionService.complete(ctx.db, input.id)),

  explainDecision: protectedProcedure.input(decisionActionSchema).query(({ ctx, input }) =>
    decisionService.explain(
      ctx.db,
      ctx.identity.preferences.timezone,
      {
        preferredStartOfDay: ctx.identity.preferences.preferredStartOfDay,
        preferredEndOfDay: ctx.identity.preferences.preferredEndOfDay,
      },
      input.id,
    ),
  ),

  listDecisions: protectedProcedure
    .input(listDecisionsSchema)
    .query(({ ctx, input }) => decisionService.list(ctx.db, input.date, input.limit ?? 100)),
});
