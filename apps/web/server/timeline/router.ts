import {
  daySchema,
  feedSchema,
  highlightsSchema,
  pinMemorySchema,
  recordEventSchema,
  searchSchema,
  snapshotSchema,
  unpinMemorySchema,
} from "@myos/core/timeline";
import { todayInTimeZone } from "@myos/core/today";
import { protectedProcedure, router } from "../trpc";
import * as service from "./service";
import * as memoriesService from "./memories";
import * as highlightsService from "./highlights";

/**
 * Timeline API (Sprint 2.13). A read-mostly surface over the immutable history:
 * feed / day / search / highlights / memories / snapshots / statistics / counts,
 * plus `record` (the single append path) and pin/unpin. All zod-validated.
 */
export const timelineRouter = router({
  record: protectedProcedure
    .input(recordEventSchema)
    .mutation(({ ctx, input }) => service.record(ctx.db, input)),

  feed: protectedProcedure.input(feedSchema).query(({ ctx, input }) => service.feed(ctx.db, input)),

  day: protectedProcedure
    .input(daySchema)
    .query(({ ctx, input }) => service.day(ctx.db, input.date)),

  search: protectedProcedure
    .input(searchSchema)
    .query(({ ctx, input }) => service.search(ctx.db, input.query)),

  highlights: protectedProcedure
    .input(highlightsSchema)
    .query(({ ctx, input }) => highlightsService.highlights(ctx.db, input)),

  memories: protectedProcedure.query(({ ctx }) => memoriesService.list(ctx.db)),

  snapshots: protectedProcedure.query(({ ctx }) =>
    highlightsService.snapshots(ctx.db, todayInTimeZone(ctx.identity.preferences.timezone)),
  ),

  snapshot: protectedProcedure
    .input(snapshotSchema)
    .query(({ ctx, input }) =>
      highlightsService.snapshot(
        ctx.db,
        input.snapshotType,
        input.date ?? todayInTimeZone(ctx.identity.preferences.timezone),
      ),
    ),

  pinMemory: protectedProcedure
    .input(pinMemorySchema)
    .mutation(({ ctx, input }) => memoriesService.pin(ctx.db, input.eventId)),

  unpinMemory: protectedProcedure
    .input(unpinMemorySchema)
    .mutation(({ ctx, input }) => memoriesService.unpin(ctx.db, input.id)),

  statistics: protectedProcedure.query(({ ctx }) => service.statistics(ctx.db)),

  counts: protectedProcedure.query(({ ctx }) =>
    service.counts(ctx.db, todayInTimeZone(ctx.identity.preferences.timezone)),
  ),
});
