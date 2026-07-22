import "server-only";
import { z } from "zod";
import { proposalActionSchema, setPolicySchema } from "@myos/core/autopilot";
import { protectedProcedure, router } from "../trpc";
import * as service from "./service";

/**
 * Autopilot router (Sprint 6.3). The Proposal-First Automation Engine's surface: plan/list proposals,
 * approve/reject, execute (verified + reversible), rollback, history, analytics, per-automation policy
 * settings. Every mutation is proposal-gated; the AI never executes. `tz` comes from the identity.
 */
export const autopilotRouter = router({
  list: protectedProcedure.query(({ ctx }) => service.list(ctx.db)),
  proposals: protectedProcedure.query(({ ctx }) =>
    service.proposals(ctx.db, ctx.identity.preferences.timezone),
  ),
  forChief: protectedProcedure.query(({ ctx }) =>
    service.forChief(ctx.db, ctx.identity.preferences.timezone),
  ),
  approve: protectedProcedure
    .input(proposalActionSchema)
    .mutation(({ ctx, input }) => service.approve(ctx.db, input.proposalId)),
  reject: protectedProcedure
    .input(proposalActionSchema)
    .mutation(({ ctx, input }) => service.reject(ctx.db, input.proposalId)),
  execute: protectedProcedure
    .input(proposalActionSchema)
    .mutation(({ ctx, input }) => service.execute(ctx.db, input.proposalId)),
  rollback: protectedProcedure
    .input(proposalActionSchema)
    .mutation(({ ctx, input }) => service.rollback(ctx.db, input.proposalId)),
  timeline: protectedProcedure
    .input(z.object({ proposalId: z.string() }))
    .query(({ ctx, input }) => service.timeline(ctx.db, input.proposalId)),
  history: protectedProcedure.query(({ ctx }) => service.history(ctx.db)),
  analytics: protectedProcedure.query(({ ctx }) => service.analytics(ctx.db)),
  settings: protectedProcedure.query(({ ctx }) => service.settings(ctx.db)),
  setPolicy: protectedProcedure
    .input(setPolicySchema)
    .mutation(({ ctx, input }) => service.setPolicy(ctx.db, input.automationId, input.policy)),
});
