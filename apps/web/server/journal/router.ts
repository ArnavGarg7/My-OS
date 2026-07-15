import {
  createEntrySchema,
  dailyReflectionSchema,
  entryActionSchema,
  linkSchema,
  reviewSchema,
  searchSchema,
  updateEntrySchema,
} from "@myos/core/journal";
import { z } from "zod";
import { protectedProcedure, router } from "../trpc";
import * as service from "./service";
import * as summaryService from "./summary";
import { prompts } from "./prompts";

/**
 * Journal API (Sprint 2.10). Thin, zod-validated tRPC surface over
 * JournalService — the canonical home for personal writing + reflection.
 */
const promptsInput = z.object({
  context: z.enum(["morning", "evening", "weekly", "monthly", "any"]).optional(),
});
const rangeInput = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
});

export const journalRouter = router({
  list: protectedProcedure
    .input(z.object({ includeArchived: z.boolean().default(false) }))
    .query(({ ctx, input }) => service.list(ctx.db, input.includeArchived)),

  get: protectedProcedure
    .input(entryActionSchema)
    .query(({ ctx, input }) => service.get(ctx.db, input.id)),

  create: protectedProcedure
    .input(createEntrySchema)
    .mutation(({ ctx, input }) => service.create(ctx.db, input)),

  update: protectedProcedure
    .input(updateEntrySchema)
    .mutation(({ ctx, input }) => service.update(ctx.db, input)),

  delete: protectedProcedure
    .input(entryActionSchema)
    .mutation(({ ctx, input }) => service.remove(ctx.db, input.id)),

  archive: protectedProcedure
    .input(entryActionSchema)
    .mutation(({ ctx, input }) => service.archive(ctx.db, input.id)),

  search: protectedProcedure
    .input(searchSchema)
    .query(({ ctx, input }) => summaryService.search(ctx.db, input.query)),

  dailyReflection: protectedProcedure
    .input(dailyReflectionSchema)
    .mutation(({ ctx, input }) =>
      service.dailyReflection(ctx.db, ctx.identity.preferences.timezone, input),
    ),

  reflections: protectedProcedure.query(({ ctx }) => service.listReflections(ctx.db)),

  review: protectedProcedure
    .input(reviewSchema)
    .mutation(({ ctx, input }) =>
      service.createReview(ctx.db, ctx.identity.preferences.timezone, input),
    ),

  reviews: protectedProcedure.query(({ ctx }) => service.listReviews(ctx.db)),

  summary: protectedProcedure
    .input(rangeInput)
    .query(({ ctx, input }) =>
      summaryService.summary(ctx.db, ctx.identity.preferences.timezone, input.date),
    ),

  signals: protectedProcedure.query(({ ctx }) =>
    summaryService.signals(ctx.db, ctx.identity.preferences.timezone),
  ),

  counts: protectedProcedure.query(({ ctx }) =>
    summaryService.counts(ctx.db, ctx.identity.preferences.timezone),
  ),

  links: protectedProcedure
    .input(z.object({ entryId: z.string().uuid() }))
    .query(({ ctx, input }) => service.links(ctx.db, input.entryId)),

  addLink: protectedProcedure
    .input(linkSchema)
    .mutation(({ ctx, input }) => service.addLink(ctx.db, input)),

  prompts: protectedProcedure
    .input(promptsInput)
    .query(({ ctx, input }) => prompts(ctx.identity.preferences.timezone, input.context)),
});
