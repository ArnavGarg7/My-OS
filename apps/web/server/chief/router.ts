import "server-only";
import { z } from "zod";
import { disruptionSchema, feedbackSchema, personalProfileSchema } from "@myos/ai/chief";
import { protectedProcedure, router } from "../trpc";
import * as service from "./service";

/**
 * Chief of Staff router (Sprint 5.2). Every endpoint composes the deterministic read models and the
 * Chief core; planner changes are always PROPOSALS (optimize/rescue/night) never applied here.
 * Protected + grounded. `tz` + the greeting name come from the identity on the context.
 */
function name(ctx: { identity: { email: string | null } }): string {
  const email = ctx.identity.email ?? "";
  const local = email.split("@")[0] ?? "there";
  return local.charAt(0).toUpperCase() + local.slice(1);
}

export const chiefRouter = router({
  now: protectedProcedure.query(({ ctx }) =>
    service.now(ctx.db, ctx.identity.preferences.timezone, name(ctx)),
  ),
  morning: protectedProcedure.query(({ ctx }) =>
    service.morning(ctx.db, ctx.identity.preferences.timezone, name(ctx)),
  ),
  optimize: protectedProcedure.mutation(({ ctx }) =>
    service.optimize(ctx.db, ctx.identity.preferences.timezone, name(ctx)),
  ),
  rescue: protectedProcedure
    .input(z.object({ disruptions: z.array(disruptionSchema).default([]) }))
    .mutation(({ ctx, input }) =>
      service.rescue(ctx.db, ctx.identity.preferences.timezone, name(ctx), input.disruptions),
    ),
  night: protectedProcedure.query(({ ctx }) =>
    service.night(ctx.db, ctx.identity.preferences.timezone, name(ctx)),
  ),
  feedback: protectedProcedure
    .input(feedbackSchema)
    .mutation(({ ctx, input }) => service.feedback(ctx.db, input)),
  profile: router({
    get: protectedProcedure.query(({ ctx }) => service.getProfile(ctx.db)),
    update: protectedProcedure
      .input(personalProfileSchema)
      .mutation(({ ctx, input }) => service.updateProfile(ctx.db, input)),
  }),
});
