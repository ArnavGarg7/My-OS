import "server-only";
import { scenarioInputSchema, predictionKindSchema } from "@myos/core/prediction";
import { protectedProcedure, router } from "../trpc";
import * as service from "./service";

/**
 * Prediction router (Sprint 6.2). The Predictive Intelligence Engine's read surface + scenario
 * simulation. Every forecast is deterministic and READ-ONLY over the OS — no prediction mutates user
 * data or triggers automation, and no AI participates. `tz` comes from the identity on the context.
 */
export const predictionRouter = router({
  current: protectedProcedure.query(({ ctx }) =>
    service.current(ctx.db, ctx.identity.preferences.timezone),
  ),
  goals: protectedProcedure.query(({ ctx }) =>
    service.kind(ctx.db, ctx.identity.preferences.timezone, "goal"),
  ),
  schedule: protectedProcedure.query(({ ctx }) =>
    service.kind(ctx.db, ctx.identity.preferences.timezone, "schedule"),
  ),
  health: protectedProcedure.query(({ ctx }) =>
    service.kind(ctx.db, ctx.identity.preferences.timezone, "health"),
  ),
  projects: protectedProcedure.query(({ ctx }) =>
    service.kind(ctx.db, ctx.identity.preferences.timezone, "project"),
  ),
  timeline: protectedProcedure.query(({ ctx }) =>
    service.timeline(ctx.db, ctx.identity.preferences.timezone),
  ),
  history: protectedProcedure.query(({ ctx }) => service.history(ctx.db)),
  forChief: protectedProcedure.query(({ ctx }) =>
    service.forChief(ctx.db, ctx.identity.preferences.timezone),
  ),
  simulate: protectedProcedure.input(scenarioInputSchema).mutation(({ ctx, input }) =>
    service.simulate(ctx.db, ctx.identity.preferences.timezone, {
      kind: input.kind,
      ...(input.amount !== undefined ? { amount: input.amount } : {}),
      ...(input.predictionId ? { predictionId: input.predictionId } : {}),
    }),
  ),
  byKind: protectedProcedure
    .input(predictionKindSchema)
    .query(({ ctx, input }) => service.kind(ctx.db, ctx.identity.preferences.timezone, input)),
});
