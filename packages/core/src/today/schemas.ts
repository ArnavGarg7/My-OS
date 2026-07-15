import { z } from "zod";
import { DAY_STATUSES, ENERGY_LEVELS, NOTE_TYPES } from "./constants";

/**
 * Today input validation (Sprint 2.1). Single source of truth for tRPC + the
 * service; update DTOs are derived from these schemas.
 */
export const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected a YYYY-MM-DD date");
export const timeSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Expected a HH:mm time");

export const energyLevelSchema = z.enum(ENERGY_LEVELS);
export const dayStatusSchema = z.enum(DAY_STATUSES);
export const noteTypeSchema = z.enum(NOTE_TYPES);

/** Optional day selector (defaults to "today" server-side). */
export const daySelectorSchema = z.object({ date: dateSchema.optional() });

export const updateStateSchema = z
  .object({
    date: dateSchema.optional(),
    wakeTime: timeSchema.nullable(),
    sleepTarget: timeSchema.nullable(),
    energyLevel: energyLevelSchema.nullable(),
    currentBlock: z.string().max(120).nullable(),
    currentActivity: z.string().max(120).nullable(),
    status: dayStatusSchema,
    morningCompleted: z.boolean(),
    eveningCompleted: z.boolean(),
  })
  .partial();

export const updateFocusSchema = z
  .object({
    date: dateSchema.optional(),
    mission: z.string().max(280).nullable(),
    blocker: z.string().max(280).nullable(),
    priority: z.string().max(280).nullable(),
    deepWork: z.string().max(280).nullable(),
    quickWin: z.string().max(280).nullable(),
  })
  .partial();

export const energyEntrySchema = z.object({ at: z.string(), level: energyLevelSchema });

export const updateMetricsSchema = z
  .object({
    date: dateSchema.optional(),
    completedTasks: z.number().int().min(0).max(1000),
    deepWorkMinutes: z.number().int().min(0).max(1440),
    meetings: z.number().int().min(0).max(100),
    interruptions: z.number().int().min(0).max(1000),
    focusSwitches: z.number().int().min(0).max(1000),
    plannerAccuracy: z.number().int().min(0).max(100).nullable(),
    energyEntries: z.array(energyEntrySchema).max(48),
  })
  .partial();

export const addNoteSchema = z.object({
  date: dateSchema.optional(),
  content: z.string().trim().min(1).max(2000),
  type: noteTypeSchema.default("note"),
});

export const listNotesSchema = daySelectorSchema;
export const decisionHistorySchema = z.object({
  date: dateSchema.optional(),
  limit: z.number().int().min(1).max(100).optional(),
});

export type DaySelectorInput = z.infer<typeof daySelectorSchema>;
export type UpdateStateInput = z.infer<typeof updateStateSchema>;
export type UpdateFocusInput = z.infer<typeof updateFocusSchema>;
export type UpdateMetricsInput = z.infer<typeof updateMetricsSchema>;
export type AddNoteInput = z.infer<typeof addNoteSchema>;
export type DecisionHistoryInput = z.infer<typeof decisionHistorySchema>;
