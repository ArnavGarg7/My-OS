import "server-only";
import { z } from "zod";
import { signalSubscriptionSchema } from "@myos/core/events";
import { protectedProcedure, router } from "../trpc";
import * as service from "./service";

/**
 * Signals router (Sprint 6.1). The Event Intelligence Engine's read surface + on-demand refresh.
 * Every cycle is deterministic and READ-ONLY over the rest of the OS — no signal mutates user data or
 * triggers automation. `tz` comes from the identity on the context.
 */
export const signalsRouter = router({
  current: protectedProcedure.query(({ ctx }) =>
    service.current(ctx.db, ctx.identity.preferences.timezone),
  ),
  today: protectedProcedure.query(({ ctx }) =>
    service.today(ctx.db, ctx.identity.preferences.timezone),
  ),
  risks: protectedProcedure.query(({ ctx }) =>
    service.risks(ctx.db, ctx.identity.preferences.timezone),
  ),
  opportunities: protectedProcedure.query(({ ctx }) =>
    service.opportunities(ctx.db, ctx.identity.preferences.timezone),
  ),
  forChief: protectedProcedure.query(({ ctx }) =>
    service.forChief(ctx.db, ctx.identity.preferences.timezone),
  ),
  timeline: protectedProcedure
    .input(z.object({ signalId: z.string().optional() }).optional())
    .query(({ ctx, input }) => service.timeline(ctx.db, input?.signalId)),
  history: protectedProcedure.query(({ ctx }) => service.history(ctx.db)),
  subscribe: protectedProcedure
    .input(signalSubscriptionSchema.optional())
    .mutation(({ ctx, input }) =>
      service.subscribe(
        ctx.db,
        input ? { categories: input.categories, minLevel: input.minLevel } : undefined,
      ),
    ),
  acknowledge: protectedProcedure
    .input(z.object({ signalId: z.string() }))
    .mutation(({ ctx, input }) => service.acknowledge(ctx.db, input.signalId)),
});
