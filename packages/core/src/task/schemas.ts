import { z } from "zod";
import {
  RECURRENCE_FREQUENCIES,
  TASK_LABEL_COLORS,
  TASK_PRIORITIES,
  TASK_STATUSES,
} from "./constants";

/**
 * Task input validation (Sprint 2.5). Shared by tRPC + the service.
 */
export const taskIdSchema = z.string().uuid();
export const taskStatusSchema = z.enum(TASK_STATUSES);
export const taskPrioritySchema = z.enum(TASK_PRIORITIES);
export const recurrenceFrequencySchema = z.enum(RECURRENCE_FREQUENCIES);
export const labelColorSchema = z.enum(TASK_LABEL_COLORS);

export const createTaskSchema = z.object({
  title: z.string().trim().min(1).max(500),
  description: z.string().trim().max(20000).optional(),
  priority: taskPrioritySchema.optional(),
  estimatedMinutes: z.number().int().min(0).max(100000).nullable().optional(),
  dueAt: z.string().datetime().nullable().optional(),
  parentTaskId: taskIdSchema.nullable().optional(),
});

export const updateTaskSchema = z.object({
  id: taskIdSchema,
  title: z.string().trim().min(1).max(500).optional(),
  description: z.string().trim().max(20000).optional(),
  status: taskStatusSchema.optional(),
  priority: taskPrioritySchema.optional(),
  estimatedMinutes: z.number().int().min(0).max(100000).nullable().optional(),
  actualMinutes: z.number().int().min(0).max(100000).nullable().optional(),
  dueAt: z.string().datetime().nullable().optional(),
});

export const taskActionSchema = z.object({ id: taskIdSchema });

export const listTasksSchema = z.object({
  status: taskStatusSchema.optional(),
  priority: taskPrioritySchema.optional(),
  labelId: taskIdSchema.optional(),
  limit: z.number().int().min(1).max(500).optional(),
});

export const searchTasksSchema = z.object({ text: z.string().trim().max(200) });

export const scheduleTaskSchema = z.object({ id: taskIdSchema });

export const dependencySchema = z.object({
  taskId: taskIdSchema,
  dependsOnTaskId: taskIdSchema,
});

export const convertInboxSchema = z.object({
  inboxId: z.string().uuid(),
  /** Optional confirmed draft overrides (the user edits before converting). */
  title: z.string().trim().min(1).max(500).optional(),
  description: z.string().trim().max(20000).optional(),
  priority: taskPrioritySchema.optional(),
  estimatedMinutes: z.number().int().min(0).max(100000).nullable().optional(),
  dueAt: z.string().datetime().nullable().optional(),
});

export const createLabelSchema = z.object({
  name: z.string().trim().min(1).max(50),
  color: labelColorSchema.default("gray"),
});

export const setRecurrenceSchema = z.object({
  taskId: taskIdSchema,
  frequency: recurrenceFrequencySchema,
  interval: z.number().int().min(1).max(365).default(1),
});

export type CreateTaskSchemaInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskSchemaInput = z.infer<typeof updateTaskSchema>;
export type ListTasksInput = z.infer<typeof listTasksSchema>;
export type ConvertInboxInput = z.infer<typeof convertInboxSchema>;
export type DependencyInput = z.infer<typeof dependencySchema>;
export type SetRecurrenceInput = z.infer<typeof setRecurrenceSchema>;
