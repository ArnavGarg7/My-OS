import {
  historySchema,
  listNotificationsSchema,
  notificationIdSchema,
  scheduleSchema,
  snoozeSchema,
  updatePreferencesSchema,
} from "@myos/core/notification";
import { protectedProcedure, router } from "../trpc";
import * as service from "./service";
import { notificationSignals } from "./signals";

/**
 * Notification API (Sprint 3.3). A zod-validated tRPC surface over the deterministic
 * Notification Engine. `generate` runs the module signals through the rules; the rest
 * drive the lifecycle. protectedProcedure only.
 */
export const notificationRouter = router({
  list: protectedProcedure.input(listNotificationsSchema).query(({ ctx, input }) => {
    if (input.status === "unread") return service.unread(ctx.db);
    if (input.status === "queued") return service.queued(ctx.db);
    if (input.status === "all") return service.list(ctx.db, input.limit ?? 100);
    return service.active(ctx.db);
  }),
  active: protectedProcedure.query(({ ctx }) => service.active(ctx.db)),
  history: protectedProcedure
    .input(historySchema)
    .query(({ ctx, input }) => service.history(ctx.db, input.limit ?? 100)),
  count: protectedProcedure.query(({ ctx }) =>
    service.count(ctx.db, ctx.identity.preferences.timezone),
  ),
  summary: protectedProcedure.query(({ ctx }) =>
    service.summary(ctx.db, ctx.identity.preferences.timezone),
  ),
  signals: protectedProcedure.query(({ ctx }) =>
    notificationSignals(ctx.db, ctx.identity.preferences.timezone),
  ),
  preferences: protectedProcedure.query(({ ctx }) => service.preferences(ctx.db)),

  generate: protectedProcedure.mutation(({ ctx }) =>
    service.generate(ctx.db, ctx.identity.preferences.timezone),
  ),
  dismiss: protectedProcedure
    .input(notificationIdSchema)
    .mutation(({ ctx, input }) => service.dismiss(ctx.db, input.id)),
  complete: protectedProcedure
    .input(notificationIdSchema)
    .mutation(({ ctx, input }) => service.complete(ctx.db, input.id)),
  markSeen: protectedProcedure
    .input(notificationIdSchema)
    .mutation(({ ctx, input }) => service.markSeen(ctx.db, input.id)),
  snooze: protectedProcedure
    .input(snoozeSchema)
    .mutation(({ ctx, input }) => service.snooze(ctx.db, input.id, input.window, input.minutes)),
  schedule: protectedProcedure
    .input(scheduleSchema)
    .mutation(({ ctx, input }) => service.schedule(ctx.db, input.id, input.window, input.minutes)),
  updatePreferences: protectedProcedure
    .input(updatePreferencesSchema)
    .mutation(({ ctx, input }) => service.updatePreferences(ctx.db, input)),

  dismissAll: protectedProcedure.mutation(({ ctx }) => service.dismissAll(ctx.db)),
  markAllRead: protectedProcedure.mutation(({ ctx }) => service.markAllRead(ctx.db)),
});
