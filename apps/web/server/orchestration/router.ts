import { historySchema, previewSchema, runIdSchema, runSchema } from "@myos/core/orchestration";
import { protectedProcedure, router } from "../trpc";
import * as service from "./service";
import { recentRecovery } from "./recovery";
import { statistics as buildStatistics, summary as buildSummaryStats } from "./summary";
import { orchestrationSignals } from "./signals";

/**
 * Orchestration API (Sprint 3.5). A zod-validated tRPC surface over the deterministic
 * Orchestration Engine. protectedProcedure only. `run` executes a pipeline through
 * EXISTING services with recovery; everything else is read-only history/summary.
 */
function prefs(ctx: {
  identity: { preferences: { preferredStartOfDay: string; preferredEndOfDay: string } };
}) {
  return {
    preferredStartOfDay: ctx.identity.preferences.preferredStartOfDay,
    preferredEndOfDay: ctx.identity.preferences.preferredEndOfDay,
  };
}

export const orchestrationRouter = router({
  run: protectedProcedure
    .input(runSchema)
    .mutation(({ ctx, input }) =>
      service.run(
        ctx.db,
        ctx.identity.preferences.timezone,
        prefs(ctx),
        input.event,
        input.source ?? "manual",
        input.payload ?? {},
      ),
    ),
  preview: protectedProcedure
    .input(previewSchema)
    .mutation(({ input }) => service.preview(input.event)),
  history: protectedProcedure
    .input(historySchema)
    .query(({ ctx, input }) => service.history(ctx.db, input.pipeline, input.limit ?? 50)),
  get: protectedProcedure
    .input(runIdSchema)
    .query(({ ctx, input }) => service.getRun(ctx.db, input.id)),
  summary: protectedProcedure.query(({ ctx }) =>
    buildSummaryStats(ctx.db, ctx.identity.preferences.timezone),
  ),
  statistics: protectedProcedure.query(({ ctx }) =>
    buildStatistics(ctx.db, ctx.identity.preferences.timezone),
  ),
  failures: protectedProcedure
    .input(historySchema)
    .query(({ ctx, input }) => service.failures(ctx.db, input.limit ?? 50)),
  recovery: protectedProcedure
    .input(historySchema)
    .query(({ ctx, input }) => recentRecovery(ctx.db, input.limit ?? 50)),
  signals: protectedProcedure.query(({ ctx }) =>
    orchestrationSignals(ctx.db, ctx.identity.preferences.timezone),
  ),
});
