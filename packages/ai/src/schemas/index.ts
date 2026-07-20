/**
 * @myos/ai/schemas — zod schemas for every machine-consumed shape crossing the platform boundary
 * (Sprint 5.1). Requests, responses, tool definitions, telemetry events, prompt metadata and
 * memory records validate against these before use. Pure — no IO.
 */
import { z } from "zod";
import { CAPABILITIES } from "../config/capabilities";

export const roleSchema = z.enum(["system", "user", "assistant", "tool"]);
export type Role = z.infer<typeof roleSchema>;

export const messageSchema = z.object({
  role: roleSchema,
  content: z.string(),
  /** Optional name for tool messages. */
  name: z.string().optional(),
});
export type Message = z.infer<typeof messageSchema>;

export const capabilitySchema = z.enum(CAPABILITIES);

/** A generation request as it enters the gateway (before routing resolves a model). */
export const aiRequestSchema = z.object({
  /** Logical feature issuing the request (for telemetry + routing). */
  feature: z.string().min(1),
  capability: capabilitySchema.default("reasoning"),
  messages: z.array(messageSchema).min(1),
  /** Optional explicit model key; otherwise routed by capability + tier. */
  model: z.string().optional(),
  maxOutputTokens: z.number().int().positive().optional(),
  /** Effort hint (06_AI_Architecture §2). */
  effort: z.enum(["low", "medium", "high"]).optional(),
  /** Optional JSON schema name for structured output (validated post-hoc). */
  structuredSchema: z.string().optional(),
  /** Free identifier used for telemetry correlation. */
  requestId: z.string().optional(),
  userId: z.string().optional(),
});
export type AiRequest = z.infer<typeof aiRequestSchema>;

export const usageSchema = z.object({
  inputTokens: z.number().int().nonnegative(),
  outputTokens: z.number().int().nonnegative(),
  cachedTokens: z.number().int().nonnegative().default(0),
});
export type Usage = z.infer<typeof usageSchema>;

export const finishReasonSchema = z.enum(["stop", "max_tokens", "tool_use", "refusal", "error"]);
export type FinishReason = z.infer<typeof finishReasonSchema>;

/** A normalized provider response (all providers converge to this shape). */
export const aiResponseSchema = z.object({
  text: z.string(),
  model: z.string(),
  provider: z.string(),
  finishReason: finishReasonSchema,
  usage: usageSchema,
  /** Present only for structured requests. */
  parsed: z.unknown().optional(),
});
export type AiResponse = z.infer<typeof aiResponseSchema>;

/** Tool definition (06_AI_Architecture §5). `schema` is a JSON-schema-ish object. */
export const toolDefinitionSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  permissions: z.array(z.string()).default([]),
  /** JSON schema for inputs (validated by the tool executor). */
  inputSchema: z.record(z.unknown()).default({}),
});
export type ToolDefinition = z.infer<typeof toolDefinitionSchema>;

/** Prompt registry metadata (06_AI_Architecture §13). */
export const promptMetadataSchema = z.object({
  name: z.string().min(1),
  version: z.string().min(1),
  owner: z.string().min(1),
  updated: z.string().min(1),
  /** Model keys this prompt is validated against. */
  compatibleModels: z.array(z.string()).default([]),
  /** Optional output schema name. */
  outputSchema: z.string().optional(),
});
export type PromptMetadata = z.infer<typeof promptMetadataSchema>;

/** Memory record (06_AI_Architecture §11). Retrieval infra only in 5.1. */
export const memoryKindSchema = z.enum(["fact", "preference", "pattern"]);
export const memorySchema = z.object({
  id: z.string(),
  kind: memoryKindSchema,
  content: z.string(),
  /** Deterministic embedding vector. */
  embedding: z.array(z.number()),
  createdAt: z.string(),
  lastUsedAt: z.string().nullable().default(null),
  useCount: z.number().int().nonnegative().default(0),
});
export type Memory = z.infer<typeof memorySchema>;

/** Telemetry event (06_AI_Architecture §Telemetry). */
export const telemetryEventSchema = z.object({
  requestId: z.string(),
  feature: z.string(),
  provider: z.string(),
  model: z.string(),
  promptVersion: z.string().nullable().default(null),
  inputTokens: z.number().int().nonnegative(),
  outputTokens: z.number().int().nonnegative(),
  cachedTokens: z.number().int().nonnegative().default(0),
  latencyMs: z.number().nonnegative(),
  retries: z.number().int().nonnegative().default(0),
  repairCount: z.number().int().nonnegative().default(0),
  toolCalls: z.number().int().nonnegative().default(0),
  toolTimeMs: z.number().nonnegative().default(0),
  costUsd: z.number().nonnegative().default(0),
  status: z.enum(["ok", "error", "refusal"]),
});
export type TelemetryEvent = z.infer<typeof telemetryEventSchema>;
