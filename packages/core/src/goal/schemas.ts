import { z } from "zod";
import {
  GOAL_LINK_TARGETS,
  GOAL_PRIORITIES,
  GOAL_STATUSES,
  GOAL_TYPES,
  HABIT_FREQUENCIES,
  METRIC_TYPES,
  REVIEW_PERIODS,
} from "./constants";

/**
 * Goal input validation (Sprint 2.12). Shared by tRPC + the service.
 */
const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const createGoalSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(20000).optional(),
  goalType: z.enum(GOAL_TYPES).default("personal"),
  priority: z.enum(GOAL_PRIORITIES).default("medium"),
  targetDate: dateSchema.nullable().default(null),
});

export const updateGoalSchema = z.object({
  id: z.string().uuid(),
  title: z.string().trim().min(1).max(200).optional(),
  description: z.string().trim().max(20000).optional(),
  goalType: z.enum(GOAL_TYPES).optional(),
  status: z.enum(GOAL_STATUSES).optional(),
  priority: z.enum(GOAL_PRIORITIES).optional(),
  targetDate: dateSchema.nullable().optional(),
});

export const goalActionSchema = z.object({ id: z.string().uuid() });

export const createObjectiveSchema = z.object({
  goalId: z.string().uuid(),
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(20000).optional(),
  weight: z.number().min(0).max(100).default(1),
});

export const createKeyResultSchema = z.object({
  objectiveId: z.string().uuid(),
  title: z.string().trim().min(1).max(200),
  metricType: z.enum(METRIC_TYPES).default("numeric"),
  targetValue: z.number().default(100),
  currentValue: z.number().min(0).default(0),
  unit: z.string().trim().max(40).default(""),
});

export const updateKeyResultSchema = z.object({
  id: z.string().uuid(),
  currentValue: z.number().min(0),
});

export const createHabitSchema = z.object({
  goalId: z.string().uuid().nullable().default(null),
  title: z.string().trim().min(1).max(200),
  frequency: z.enum(HABIT_FREQUENCIES).default("daily"),
  target: z.number().int().min(1).default(1),
});

export const completeHabitSchema = z.object({
  id: z.string().uuid(),
  date: dateSchema.optional(),
});

export const createReviewSchema = z.object({
  goalId: z.string().uuid(),
  reviewPeriod: z.enum(REVIEW_PERIODS),
  summary: z.string().trim().max(20000).optional(),
});

export const goalLinkSchema = z.object({
  goalId: z.string().uuid(),
  target: z.enum(GOAL_LINK_TARGETS),
  targetId: z.string().uuid(),
});

export const searchGoalsSchema = z.object({ query: z.string().trim().max(200) });
export const listGoalsSchema = z.object({ status: z.enum(GOAL_STATUSES).optional() });

export type CreateGoalSchemaInput = z.infer<typeof createGoalSchema>;
export type CreateObjectiveInput = z.infer<typeof createObjectiveSchema>;
export type CreateKeyResultInput = z.infer<typeof createKeyResultSchema>;
export type CreateHabitInput = z.infer<typeof createHabitSchema>;
