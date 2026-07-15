import {
  addInterruptionSchema,
  beginBreakSchema,
  completeSessionSchema,
  historySchema,
  sessionIdSchema,
  setNotesSchema,
  startSessionSchema,
  switchTaskSchema,
} from "@myos/core/focus";
import { protectedProcedure, router } from "../trpc";
import * as service from "./service";
import * as summaryService from "./summary";
import { focusSignals } from "./signals";

/**
 * Focus API (Sprint 3.2). A zod-validated tRPC surface over the deterministic focus
 * workflow. Sessions reference existing tasks/planner blocks/projects; completing a
 * session updates planner execution state only and never auto-completes a task.
 */
export const focusRouter = router({
  active: protectedProcedure.query(({ ctx }) => service.active(ctx.db)),
  today: protectedProcedure.query(({ ctx }) =>
    service.listToday(ctx.db, ctx.identity.preferences.timezone),
  ),
  summary: protectedProcedure.query(({ ctx }) =>
    summaryService.summary(ctx.db, ctx.identity.preferences.timezone),
  ),
  metrics: protectedProcedure.query(({ ctx }) =>
    summaryService.metrics(ctx.db, ctx.identity.preferences.timezone),
  ),
  readiness: protectedProcedure.query(({ ctx }) =>
    summaryService.readiness(ctx.db, ctx.identity.preferences.timezone),
  ),
  recommendations: protectedProcedure.query(({ ctx }) =>
    service.recommendations(ctx.db, ctx.identity.preferences.timezone),
  ),
  signals: protectedProcedure.query(({ ctx }) =>
    focusSignals(ctx.db, ctx.identity.preferences.timezone),
  ),
  history: protectedProcedure
    .input(historySchema)
    .query(({ ctx, input }) => service.history(ctx.db, input.limit ?? 50)),

  start: protectedProcedure
    .input(startSessionSchema)
    .mutation(({ ctx, input }) => service.start(ctx.db, ctx.identity.preferences.timezone, input)),
  pause: protectedProcedure
    .input(sessionIdSchema)
    .mutation(({ ctx, input }) =>
      service.pause(ctx.db, ctx.identity.preferences.timezone, input.sessionId),
    ),
  resume: protectedProcedure
    .input(sessionIdSchema)
    .mutation(({ ctx, input }) =>
      service.resume(ctx.db, ctx.identity.preferences.timezone, input.sessionId),
    ),
  complete: protectedProcedure
    .input(completeSessionSchema)
    .mutation(({ ctx, input }) =>
      service.complete(
        ctx.db,
        ctx.identity.preferences.timezone,
        input.sessionId,
        input.energyAfter ?? null,
        input.notes,
      ),
    ),
  cancel: protectedProcedure
    .input(sessionIdSchema)
    .mutation(({ ctx, input }) =>
      service.cancel(ctx.db, ctx.identity.preferences.timezone, input.sessionId),
    ),
  abandon: protectedProcedure
    .input(sessionIdSchema)
    .mutation(({ ctx, input }) =>
      service.abandon(ctx.db, ctx.identity.preferences.timezone, input.sessionId),
    ),
  break: protectedProcedure
    .input(beginBreakSchema)
    .mutation(({ ctx, input }) =>
      service.beginBreak(
        ctx.db,
        ctx.identity.preferences.timezone,
        input.sessionId,
        input.type,
        input.minutes,
      ),
    ),
  addInterruption: protectedProcedure
    .input(addInterruptionSchema)
    .mutation(({ ctx, input }) =>
      service.addInterruption(
        ctx.db,
        ctx.identity.preferences.timezone,
        input.sessionId,
        input.type,
        input.note,
      ),
    ),
  switchTask: protectedProcedure.input(switchTaskSchema).mutation(({ ctx, input }) =>
    service.switchTask(ctx.db, ctx.identity.preferences.timezone, input.sessionId, {
      taskId: input.taskId ?? null,
      projectId: input.projectId ?? null,
      plannerBlockId: input.plannerBlockId ?? null,
    }),
  ),
  setNotes: protectedProcedure
    .input(setNotesSchema)
    .mutation(({ ctx, input }) =>
      service.setNotes(ctx.db, ctx.identity.preferences.timezone, input.sessionId, input.notes),
    ),
});
