import {
  createEventSchema,
  eventActionSchema,
  exportSchema,
  importSchema,
  listEventsSchema,
  rangeSchema,
  syncSchema,
  toggleCalendarSchema,
  updateEventSchema,
} from "@myos/core/calendar";
import { protectedProcedure, router } from "../trpc";
import * as service from "./service";

/**
 * Calendar API (Sprint 2.7). Thin, zod-validated tRPC surface over
 * CalendarService — the single source of truth for time.
 */
function prefs(ctx: {
  identity: { preferences: { preferredStartOfDay: string; preferredEndOfDay: string } };
}) {
  return {
    preferredStartOfDay: ctx.identity.preferences.preferredStartOfDay,
    preferredEndOfDay: ctx.identity.preferences.preferredEndOfDay,
  };
}

export const calendarRouter = router({
  list: protectedProcedure
    .input(listEventsSchema)
    .query(({ ctx, input }) => service.list(ctx.db, input)),

  get: protectedProcedure
    .input(eventActionSchema)
    .query(({ ctx, input }) => service.get(ctx.db, input.id)),

  create: protectedProcedure
    .input(createEventSchema)
    .mutation(({ ctx, input }) => service.create(ctx.db, input)),

  update: protectedProcedure
    .input(updateEventSchema)
    .mutation(({ ctx, input }) => service.update(ctx.db, input)),

  delete: protectedProcedure
    .input(eventActionSchema)
    .mutation(({ ctx, input }) => service.remove(ctx.db, input.id)),

  import: protectedProcedure
    .input(importSchema)
    .mutation(({ ctx, input }) => service.importEvents(ctx.db, input.ics, input.calendarId)),

  export: protectedProcedure
    .input(exportSchema)
    .query(({ ctx, input }) => service.exportEvents(ctx.db, input.calendarId)),

  sync: protectedProcedure
    .input(syncSchema)
    .mutation(({ ctx, input }) => service.sync(ctx.db, input.provider)),

  conflicts: protectedProcedure
    .input(rangeSchema)
    .query(({ ctx, input }) =>
      service.conflicts(ctx.db, ctx.identity.preferences.timezone, prefs(ctx), input.date),
    ),

  freeBusy: protectedProcedure
    .input(rangeSchema)
    .query(({ ctx, input }) =>
      service.freeBusy(ctx.db, ctx.identity.preferences.timezone, prefs(ctx), input.date),
    ),

  availability: protectedProcedure
    .input(rangeSchema)
    .query(({ ctx, input }) =>
      service.availability(ctx.db, ctx.identity.preferences.timezone, prefs(ctx), input.date),
    ),

  summary: protectedProcedure
    .input(rangeSchema)
    .query(({ ctx, input }) =>
      service.summary(ctx.db, ctx.identity.preferences.timezone, prefs(ctx), input.date),
    ),

  toggle: protectedProcedure
    .input(toggleCalendarSchema)
    .mutation(({ ctx, input }) => service.toggle(ctx.db, input.id, input.visible)),

  providers: protectedProcedure.query(({ ctx }) => service.providers(ctx.db)),
});
