import {
  captureSchema,
  inboxActionSchema,
  listInboxSchema,
  organizeSchema,
  searchInboxSchema,
} from "@myos/core/inbox";
import { protectedProcedure, router } from "../trpc";
import * as service from "./service";

/**
 * Inbox API (Sprint 2.4). Thin, zod-validated tRPC surface over InboxService.
 * Every capture lands in the inbox as `new`; nothing is auto-categorized.
 */
export const inboxRouter = router({
  capture: protectedProcedure
    .input(captureSchema)
    .mutation(({ ctx, input }) => service.capture(ctx.db, input)),

  list: protectedProcedure
    .input(listInboxSchema)
    .query(({ ctx, input }) => service.list(ctx.db, input)),

  get: protectedProcedure
    .input(inboxActionSchema)
    .query(({ ctx, input }) => service.get(ctx.db, input.id)),

  archive: protectedProcedure
    .input(inboxActionSchema)
    .mutation(({ ctx, input }) => service.archive(ctx.db, input.id)),

  delete: protectedProcedure
    .input(inboxActionSchema)
    .mutation(({ ctx, input }) => service.remove(ctx.db, input.id)),

  restore: protectedProcedure
    .input(inboxActionSchema)
    .mutation(({ ctx, input }) => service.restore(ctx.db, input.id)),

  organize: protectedProcedure
    .input(organizeSchema)
    .mutation(({ ctx, input }) => service.organize(ctx.db, input.id, input.destination)),

  search: protectedProcedure
    .input(searchInboxSchema)
    .query(({ ctx, input }) => service.search(ctx.db, input)),

  suggestDestination: protectedProcedure
    .input(inboxActionSchema)
    .query(({ ctx, input }) => service.suggest(ctx.db, input.id)),

  countNew: protectedProcedure.query(({ ctx }) => service.countNew(ctx.db)),
});
