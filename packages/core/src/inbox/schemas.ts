import { z } from "zod";
import { CAPTURE_SOURCES, CAPTURE_STATUSES, CAPTURE_TYPES, DESTINATIONS } from "./constants";

/**
 * Inbox input validation (Sprint 2.4). Shared by tRPC + the service.
 */
export const captureTypeSchema = z.enum(CAPTURE_TYPES);
export const captureStatusSchema = z.enum(CAPTURE_STATUSES);
export const captureSourceSchema = z.enum(CAPTURE_SOURCES);
export const destinationSchema = z.enum(DESTINATIONS);

export const inboxIdSchema = z.string().uuid();

export const captureSchema = z.object({
  type: captureTypeSchema,
  title: z.string().trim().max(200).optional(),
  content: z.string().trim().min(1).max(20000),
  source: captureSourceSchema.default("quick_add"),
  metadata: z.record(z.unknown()).optional(),
});

export const inboxActionSchema = z.object({ id: inboxIdSchema });

export const organizeSchema = z.object({
  id: inboxIdSchema,
  destination: destinationSchema,
});

export const listInboxSchema = z.object({
  status: captureStatusSchema.optional(),
  type: captureTypeSchema.optional(),
  limit: z.number().int().min(1).max(500).optional(),
});

export const searchInboxSchema = z.object({
  text: z.string().trim().max(200).optional(),
  type: captureTypeSchema.optional(),
  status: captureStatusSchema.optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  keywords: z.array(z.string().trim().min(1)).optional(),
});

export type CaptureSchemaInput = z.infer<typeof captureSchema>;
export type OrganizeInput = z.infer<typeof organizeSchema>;
export type ListInboxInput = z.infer<typeof listInboxSchema>;
export type SearchInboxInput = z.infer<typeof searchInboxSchema>;
