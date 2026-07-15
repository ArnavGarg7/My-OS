import { z } from "zod";
import { GROUPINGS, SNAPSHOT_TYPES, TIMELINE_SOURCES } from "./constants";

/**
 * Timeline zod schemas (Sprint 2.13). Validate the tRPC surface — recording an
 * event, feed/day/search queries, snapshot + memory operations. Events are
 * append-only: there is no update/delete schema by design (immutable history).
 */

export const timelineSourceSchema = z.enum(TIMELINE_SOURCES);
export const groupingSchema = z.enum(GROUPINGS);
export const snapshotTypeSchema = z.enum(SNAPSHOT_TYPES);

export const recordEventSchema = z.object({
  eventType: z.string().min(1).max(80),
  source: timelineSourceSchema,
  entityId: z.string().max(200).nullish(),
  title: z.string().min(1).max(300),
  summary: z.string().max(1000).optional(),
  timestamp: z.string().datetime().optional(),
  importance: z.number().int().min(0).max(100).optional(),
  metadata: z.record(z.unknown()).optional(),
});
export type RecordEventInput = z.infer<typeof recordEventSchema>;

export const feedSchema = z.object({
  sources: z.array(timelineSourceSchema).optional(),
  eventTypes: z.array(z.string()).optional(),
  minImportance: z.number().int().min(0).max(100).optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  grouping: groupingSchema.optional(),
  limit: z.number().int().min(1).max(500).optional(),
});
export type FeedInput = z.infer<typeof feedSchema>;

export const daySchema = z.object({ date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) });
export const searchSchema = z.object({ query: z.string().max(200) });
export const highlightsSchema = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
});
export const snapshotSchema = z.object({
  snapshotType: snapshotTypeSchema,
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
});
export const pinMemorySchema = z.object({ eventId: z.string().min(1) });
export const unpinMemorySchema = z.object({ id: z.string().min(1) });
