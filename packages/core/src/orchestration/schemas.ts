import { z } from "zod";
import { PIPELINE_KINDS, TRIGGER_SOURCES } from "./constants";

/**
 * Orchestration zod schemas (Sprint 3.5). Validate the tRPC surface — run/preview a
 * pipeline, query history/failures/recovery. Deterministic.
 */
export const pipelineKindSchema = z.enum(PIPELINE_KINDS);
export const triggerSourceSchema = z.enum(TRIGGER_SOURCES);

export const runSchema = z.object({
  event: z.string().min(1).max(120),
  source: triggerSourceSchema.optional(),
  payload: z.record(z.unknown()).optional(),
});

export const previewSchema = z.object({
  event: z.string().min(1).max(120),
});

export const historySchema = z.object({
  pipeline: pipelineKindSchema.optional(),
  limit: z.number().int().min(1).max(200).optional(),
});

export const runIdSchema = z.object({ id: z.string().uuid() });
