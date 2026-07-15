import {
  attachTaskSchema,
  createMilestoneSchema,
  createObjectiveSchema,
  createProjectSchema,
  listProjectsSchema,
  projectActionSchema,
  projectDependencySchema,
  searchProjectsSchema,
  updateObjectiveSchema,
  updateProjectSchema,
} from "@myos/core/project";
import { z } from "zod";
import { protectedProcedure, router } from "../trpc";
import * as service from "./service";

/**
 * Project API (Sprint 2.8). Thin, zod-validated tRPC surface over ProjectService
 * — projects own long-term outcomes above the execution layer.
 */
const idSchema = z.object({ id: z.string().uuid() });
const projectIdSchema = z.object({ projectId: z.string().uuid() });

export const projectRouter = router({
  list: protectedProcedure
    .input(listProjectsSchema)
    .query(({ ctx, input }) => service.list(ctx.db, input)),

  get: protectedProcedure
    .input(projectActionSchema)
    .query(({ ctx, input }) => service.get(ctx.db, input.id)),

  create: protectedProcedure
    .input(createProjectSchema)
    .mutation(({ ctx, input }) => service.create(ctx.db, input)),

  update: protectedProcedure
    .input(updateProjectSchema)
    .mutation(({ ctx, input }) => service.update(ctx.db, input)),

  delete: protectedProcedure
    .input(projectActionSchema)
    .mutation(({ ctx, input }) => service.remove(ctx.db, input.id)),

  archive: protectedProcedure
    .input(projectActionSchema)
    .mutation(({ ctx, input }) => service.archive(ctx.db, input.id)),

  timeline: protectedProcedure
    .input(projectActionSchema)
    .query(({ ctx, input }) => service.timeline(ctx.db, input.id)),

  portfolio: protectedProcedure.query(({ ctx }) => service.portfolio(ctx.db)),

  roadmap: protectedProcedure.query(({ ctx }) => service.roadmap(ctx.db)),

  progress: protectedProcedure
    .input(projectActionSchema)
    .query(({ ctx, input }) => service.progress(ctx.db, input.id)),

  health: protectedProcedure
    .input(projectActionSchema)
    .query(({ ctx, input }) => service.health(ctx.db, input.id)),

  forecast: protectedProcedure
    .input(projectActionSchema)
    .query(({ ctx, input }) => service.forecast(ctx.db, input.id)),

  burndown: protectedProcedure
    .input(projectActionSchema)
    .query(({ ctx, input }) => service.burndown(ctx.db, input.id)),

  summary: protectedProcedure
    .input(projectActionSchema)
    .query(({ ctx, input }) => service.summary(ctx.db, input.id)),

  dependencies: protectedProcedure.query(({ ctx }) => service.listDependencies(ctx.db)),

  addDependency: protectedProcedure
    .input(projectDependencySchema)
    .mutation(({ ctx, input }) => service.addDependency(ctx.db, input)),

  removeDependency: protectedProcedure
    .input(projectDependencySchema)
    .mutation(({ ctx, input }) => service.removeDependency(ctx.db, input)),

  milestones: protectedProcedure
    .input(projectIdSchema)
    .query(({ ctx, input }) => service.listMilestones(ctx.db, input.projectId)),

  createMilestone: protectedProcedure
    .input(createMilestoneSchema)
    .mutation(({ ctx, input }) => service.createMilestone(ctx.db, input)),

  completeMilestone: protectedProcedure
    .input(idSchema)
    .mutation(({ ctx, input }) => service.completeMilestone(ctx.db, input.id)),

  objectives: protectedProcedure
    .input(projectIdSchema)
    .query(({ ctx, input }) => service.listObjectives(ctx.db, input.projectId)),

  createObjective: protectedProcedure
    .input(createObjectiveSchema)
    .mutation(({ ctx, input }) => service.createObjective(ctx.db, input)),

  updateObjective: protectedProcedure
    .input(updateObjectiveSchema)
    .mutation(({ ctx, input }) => service.updateObjective(ctx.db, input)),

  history: protectedProcedure
    .input(projectIdSchema)
    .query(({ ctx, input }) => service.history(ctx.db, input.projectId)),

  attachTask: protectedProcedure
    .input(attachTaskSchema)
    .mutation(({ ctx, input }) => service.attachTask(ctx.db, input)),

  detachTask: protectedProcedure
    .input(z.object({ taskId: z.string().uuid() }))
    .mutation(({ ctx, input }) => service.detachTask(ctx.db, input.taskId)),

  search: protectedProcedure
    .input(searchProjectsSchema)
    .query(({ ctx, input }) => service.search(ctx.db, input.text)),
});
