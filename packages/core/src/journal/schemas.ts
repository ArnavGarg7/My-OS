import { z } from "zod";
import { ENTRY_TYPES, LINK_TARGETS, MOOD_LEVELS, REVIEW_PERIODS } from "./constants";

/**
 * Journal input validation (Sprint 2.10). Shared by tRPC + the service.
 */
const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const createEntrySchema = z.object({
  title: z.string().trim().max(300).default(""),
  content: z.string().max(50000).default(""),
  entryType: z.enum(ENTRY_TYPES).default("daily"),
  mood: z.enum(MOOD_LEVELS).nullable().default(null),
  tags: z.array(z.string().trim().max(40)).max(20).default([]),
});

export const updateEntrySchema = z.object({
  id: z.string().uuid(),
  title: z.string().trim().max(300).optional(),
  content: z.string().max(50000).optional(),
  entryType: z.enum(ENTRY_TYPES).optional(),
  mood: z.enum(MOOD_LEVELS).nullable().optional(),
  tags: z.array(z.string().trim().max(40)).max(20).optional(),
});

export const entryActionSchema = z.object({ id: z.string().uuid() });

export const dailyReflectionSchema = z.object({
  date: dateSchema.optional(),
  reflection: z.string().max(20000).default(""),
  wins: z.array(z.string().trim().max(500)).max(20).default([]),
  lessons: z.array(z.string().trim().max(500)).max(20).default([]),
  gratitude: z.array(z.string().trim().max(500)).max(20).default([]),
  tomorrowFocus: z.string().trim().max(1000).default(""),
});

export const reviewSchema = z.object({
  period: z.enum(REVIEW_PERIODS),
  summary: z.string().trim().max(20000).optional(),
});

export const linkSchema = z.object({
  entryId: z.string().uuid(),
  target: z.enum(LINK_TARGETS),
  targetId: z.string().uuid(),
});

export const searchSchema = z.object({ query: z.string().trim().max(200) });

export const promptsSchema = z.object({
  context: z.enum(["morning", "evening", "weekly", "monthly", "any"]).optional(),
});

export const rangeSchema = z.object({ date: dateSchema.optional() });

export const historySchema = z.object({ days: z.number().int().min(1).max(365).default(30) });

export type CreateEntrySchemaInput = z.infer<typeof createEntrySchema>;
export type UpdateEntrySchemaInput = z.infer<typeof updateEntrySchema>;
export type DailyReflectionSchemaInput = z.infer<typeof dailyReflectionSchema>;
