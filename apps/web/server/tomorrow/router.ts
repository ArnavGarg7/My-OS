import {
  confirmCarryForwardSchema,
  finalizeSchema,
  previewSchema,
  selectPrioritiesSchema,
  toggleChecklistSchema,
} from "@myos/core/tomorrow";
import { protectedProcedure, router } from "../trpc";
import * as service from "./service";
import * as plannerPreview from "./planner";
import * as reviewService from "./review";

/**
 * Tomorrow Studio API (Sprint 3.1). A zod-validated tRPC surface over the
 * deterministic evening workflow. Carry-forward + priorities are explicit
 * confirmations; the planner preview never overwrites today. Read-mostly with a
 * few mutations that persist the plan header, priorities, checklist + review.
 */
function prefs(ctx: {
  identity: { preferences: { preferredStartOfDay: string; preferredEndOfDay: string } };
}) {
  return {
    preferredStartOfDay: ctx.identity.preferences.preferredStartOfDay,
    preferredEndOfDay: ctx.identity.preferences.preferredEndOfDay,
  };
}

export const tomorrowRouter = router({
  get: protectedProcedure.query(({ ctx }) =>
    service.get(ctx.db, ctx.identity.preferences.timezone),
  ),
  review: protectedProcedure.query(({ ctx }) =>
    service.review(ctx.db, ctx.identity.preferences.timezone),
  ),
  carryForward: protectedProcedure.query(({ ctx }) =>
    service.carryForward(ctx.db, ctx.identity.preferences.timezone),
  ),
  priorities: protectedProcedure.query(({ ctx }) =>
    service.priorities(ctx.db, ctx.identity.preferences.timezone),
  ),
  readiness: protectedProcedure.query(({ ctx }) =>
    service.readiness(ctx.db, ctx.identity.preferences.timezone),
  ),
  checklist: protectedProcedure.query(({ ctx }) =>
    service.checklist(ctx.db, ctx.identity.preferences.timezone),
  ),
  summary: protectedProcedure.query(({ ctx }) =>
    service.summary(ctx.db, ctx.identity.preferences.timezone),
  ),
  counts: protectedProcedure.query(({ ctx }) =>
    service.counts(ctx.db, ctx.identity.preferences.timezone),
  ),

  confirmCarryForward: protectedProcedure
    .input(confirmCarryForwardSchema)
    .mutation(async ({ ctx }) => ({
      ok: true,
      ...(await service.get(ctx.db, ctx.identity.preferences.timezone)),
    })),
  savePriorities: protectedProcedure
    .input(selectPrioritiesSchema)
    .mutation(({ ctx, input }) =>
      service.savePriorities(ctx.db, ctx.identity.preferences.timezone, input.priorities),
    ),
  toggleChecklist: protectedProcedure
    .input(toggleChecklistSchema)
    .mutation(({ ctx, input }) =>
      service.toggleChecklist(
        ctx.db,
        ctx.identity.preferences.timezone,
        input.itemId,
        input.completed,
      ),
    ),

  preview: protectedProcedure.input(previewSchema).mutation(({ ctx, input }) => {
    const tz = ctx.identity.preferences.timezone;
    if (input.action === "discard") return plannerPreview.discard(ctx.db, tz, prefs(ctx));
    if (input.action === "accept") return plannerPreview.currentPreview(ctx.db, tz, prefs(ctx));
    return plannerPreview.preview(ctx.db, tz, prefs(ctx));
  }),
  currentPreview: protectedProcedure.query(({ ctx }) =>
    plannerPreview.currentPreview(ctx.db, ctx.identity.preferences.timezone, prefs(ctx)),
  ),

  finalize: protectedProcedure.input(finalizeSchema).mutation(async ({ ctx }) => {
    const tz = ctx.identity.preferences.timezone;
    await reviewService.persistReview(ctx.db, tz);
    return service.finalize(ctx.db, tz);
  }),
  lock: protectedProcedure.mutation(({ ctx }) =>
    service.lock(ctx.db, ctx.identity.preferences.timezone),
  ),
  reopen: protectedProcedure.mutation(({ ctx }) =>
    service.reopen(ctx.db, ctx.identity.preferences.timezone),
  ),

  recentReviews: protectedProcedure.query(({ ctx }) =>
    reviewService.recent(ctx.db, ctx.identity.preferences.timezone),
  ),
});
