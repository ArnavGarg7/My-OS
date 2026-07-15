import {
  convertInboxSchema,
  createLabelSchema,
  createTaskSchema,
  dependencySchema,
  listTasksSchema,
  scheduleTaskSchema,
  searchTasksSchema,
  setRecurrenceSchema,
  taskActionSchema,
  updateTaskSchema,
} from "@myos/core/task";
import { protectedProcedure, router } from "../trpc";
import * as service from "./service";

/**
 * Task API (Sprint 2.5). Thin, zod-validated tRPC surface over TaskService.
 * The canonical work model — consumed by Planner/Projects/AI later.
 */
export const taskRouter = router({
  list: protectedProcedure
    .input(listTasksSchema)
    .query(({ ctx, input }) => service.list(ctx.db, input)),

  get: protectedProcedure
    .input(taskActionSchema)
    .query(({ ctx, input }) => service.get(ctx.db, input.id)),

  create: protectedProcedure
    .input(createTaskSchema)
    .mutation(({ ctx, input }) => service.create(ctx.db, input)),

  update: protectedProcedure
    .input(updateTaskSchema)
    .mutation(({ ctx, input }) => service.update(ctx.db, input)),

  complete: protectedProcedure
    .input(taskActionSchema)
    .mutation(({ ctx, input }) => service.complete(ctx.db, input.id)),

  archive: protectedProcedure
    .input(taskActionSchema)
    .mutation(({ ctx, input }) => service.archive(ctx.db, input.id)),

  delete: protectedProcedure
    .input(taskActionSchema)
    .mutation(({ ctx, input }) => service.remove(ctx.db, input.id)),

  schedule: protectedProcedure.input(scheduleTaskSchema).mutation(({ ctx, input }) =>
    service.schedule(
      ctx.db,
      ctx.identity.preferences.timezone,
      {
        preferredStartOfDay: ctx.identity.preferences.preferredStartOfDay,
        preferredEndOfDay: ctx.identity.preferences.preferredEndOfDay,
      },
      input.id,
    ),
  ),

  addDependency: protectedProcedure
    .input(dependencySchema)
    .mutation(({ ctx, input }) =>
      service.addDependency(ctx.db, input.taskId, input.dependsOnTaskId),
    ),

  removeDependency: protectedProcedure
    .input(dependencySchema)
    .mutation(({ ctx, input }) =>
      service.removeDependency(ctx.db, input.taskId, input.dependsOnTaskId),
    ),

  convertInbox: protectedProcedure
    .input(convertInboxSchema)
    .mutation(({ ctx, input }) => service.convertInbox(ctx.db, input)),

  search: protectedProcedure
    .input(searchTasksSchema)
    .query(({ ctx, input }) => service.search(ctx.db, input.text)),

  labels: protectedProcedure.query(({ ctx }) => service.labels(ctx.db)),

  createLabel: protectedProcedure
    .input(createLabelSchema)
    .mutation(({ ctx, input }) => service.createLabel(ctx.db, input)),

  recurring: protectedProcedure
    .input(setRecurrenceSchema)
    .mutation(({ ctx, input }) => service.setRecurrence(ctx.db, input)),

  counts: protectedProcedure.query(({ ctx }) => service.counts(ctx.db)),
});
