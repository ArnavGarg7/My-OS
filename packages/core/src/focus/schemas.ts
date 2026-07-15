import { z } from "zod";
import { BREAK_TYPES, INTERRUPTION_TYPES, SESSION_TYPES } from "./constants";

/**
 * Focus zod schemas (Sprint 3.2). Validate the tRPC surface — start/pause/resume/
 * complete/cancel/break/interruption/summary/history/metrics. All deterministic.
 */
export const sessionTypeSchema = z.enum(SESSION_TYPES);
export const breakTypeSchema = z.enum(BREAK_TYPES);
export const interruptionTypeSchema = z.enum(INTERRUPTION_TYPES);

export const startSessionSchema = z.object({
  taskId: z.string().uuid().nullish(),
  plannerBlockId: z.string().uuid().nullish(),
  projectId: z.string().uuid().nullish(),
  type: sessionTypeSchema.optional(),
  plannedMinutes: z.number().int().min(1).max(600).optional(),
  energyBefore: z.number().int().min(0).max(100).nullish(),
  notes: z.string().max(2000).optional(),
});

export const sessionIdSchema = z.object({ sessionId: z.string().uuid() });

export const completeSessionSchema = z.object({
  sessionId: z.string().uuid(),
  energyAfter: z.number().int().min(0).max(100).nullish(),
  notes: z.string().max(2000).optional(),
});

export const beginBreakSchema = z.object({
  sessionId: z.string().uuid(),
  type: breakTypeSchema.optional(),
  minutes: z.number().int().min(1).max(120).optional(),
});

export const addInterruptionSchema = z.object({
  sessionId: z.string().uuid(),
  type: interruptionTypeSchema,
  note: z.string().max(500).optional(),
});

export const switchTaskSchema = z.object({
  sessionId: z.string().uuid(),
  taskId: z.string().uuid().nullish(),
  projectId: z.string().uuid().nullish(),
  plannerBlockId: z.string().uuid().nullish(),
});

export const setNotesSchema = z.object({
  sessionId: z.string().uuid(),
  notes: z.string().max(2000),
});

export const historySchema = z.object({
  date: z.string().optional(),
  limit: z.number().int().min(1).max(200).optional(),
});

export const metricsSchema = z.object({ date: z.string().optional() });
