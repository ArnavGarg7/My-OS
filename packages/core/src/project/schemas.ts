import { z } from "zod";
import { PROJECT_COLORS, PROJECT_PRIORITIES, PROJECT_STATUSES } from "./constants";

/**
 * Project input validation (Sprint 2.8). Shared by tRPC + the service.
 */
export const projectIdSchema = z.string().uuid();
const dateSchema = z.string().datetime().nullable();

export const createProjectSchema = z.object({
  name: z.string().trim().min(1).max(200),
  description: z.string().trim().max(20000).optional(),
  priority: z.enum(PROJECT_PRIORITIES).optional(),
  color: z.enum(PROJECT_COLORS).optional(),
  owner: z.string().trim().max(200).optional(),
  startDate: dateSchema.optional(),
  targetDate: dateSchema.optional(),
});

export const updateProjectSchema = z.object({
  id: projectIdSchema,
  name: z.string().trim().min(1).max(200).optional(),
  description: z.string().trim().max(20000).optional(),
  status: z.enum(PROJECT_STATUSES).optional(),
  priority: z.enum(PROJECT_PRIORITIES).optional(),
  color: z.enum(PROJECT_COLORS).optional(),
  startDate: dateSchema.optional(),
  targetDate: dateSchema.optional(),
});

export const projectActionSchema = z.object({ id: projectIdSchema });

export const listProjectsSchema = z.object({
  status: z.enum(PROJECT_STATUSES).optional(),
});

export const createMilestoneSchema = z.object({
  projectId: projectIdSchema,
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(20000).optional(),
  dueDate: dateSchema.optional(),
  order: z.number().int().min(0).optional(),
});

export const milestoneActionSchema = z.object({ id: z.string().uuid() });

export const createObjectiveSchema = z.object({
  projectId: projectIdSchema,
  title: z.string().trim().min(1).max(200),
  targetValue: z.number().min(0),
  unit: z.string().trim().max(50).default(""),
});

export const updateObjectiveSchema = z.object({
  id: z.string().uuid(),
  currentValue: z.number().min(0),
});

export const projectDependencySchema = z.object({
  projectId: projectIdSchema,
  dependsOn: projectIdSchema,
});

export const attachTaskSchema = z.object({
  taskId: z.string().uuid(),
  projectId: projectIdSchema.nullable(),
  milestoneId: z.string().uuid().nullable().optional(),
  objectiveId: z.string().uuid().nullable().optional(),
});

export const searchProjectsSchema = z.object({ text: z.string().trim().max(200) });

export type CreateProjectSchemaInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectSchemaInput = z.infer<typeof updateProjectSchema>;
export type CreateMilestoneInput = z.infer<typeof createMilestoneSchema>;
export type CreateObjectiveInput = z.infer<typeof createObjectiveSchema>;
export type AttachTaskInput = z.infer<typeof attachTaskSchema>;
