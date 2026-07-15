import { z } from "zod";
import { PLANNER_BLOCK_TYPES } from "./constants";

/**
 * Planner input validation (Sprint 2.6). Shared by tRPC + the service.
 */
const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const plannerDaySchema = z.object({ date: dateSchema.optional() });
export const generatePlannerSchema = z.object({ date: dateSchema.optional() });

export const blockIdSchema = z.string().uuid();
export const blockActionSchema = z.object({ id: blockIdSchema });

export const moveBlockSchema = z.object({
  id: blockIdSchema,
  direction: z.enum(["earlier", "later"]),
  minutes: z.number().int().min(1).max(240).optional(),
});

export const manualBlockSchema = z.object({
  date: dateSchema.optional(),
  title: z.string().trim().min(1).max(200),
  type: z.enum(PLANNER_BLOCK_TYPES).default("meeting"),
  start: z.string().datetime(),
  end: z.string().datetime(),
});

export const plannerHistorySchema = z.object({
  date: dateSchema.optional(),
  limit: z.number().int().min(1).max(200).optional(),
});

export type GeneratePlannerInput = z.infer<typeof generatePlannerSchema>;
export type MoveBlockInput = z.infer<typeof moveBlockSchema>;
export type ManualBlockInput = z.infer<typeof manualBlockSchema>;
