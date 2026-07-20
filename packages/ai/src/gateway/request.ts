/**
 * Request normalization (Sprint 5.1). Validates an incoming request against the schema, fills
 * defaults, and builds the provider-specific input once a model is resolved. Pure.
 */
import { getModel } from "../config/models";
import { aiRequestSchema, type AiRequest } from "../schemas";
import type { ProviderGenerateInput } from "../providers/types";

/** Validate + default a raw request. Throws (zod) on invalid input. */
export function normalizeRequest(raw: unknown): AiRequest {
  return aiRequestSchema.parse(raw);
}

/** Build the provider call input for a resolved model. Caps output tokens to the model's max. */
export function buildProviderInput(request: AiRequest, modelKey: string): ProviderGenerateInput {
  const model = getModel(modelKey);
  const modelId = model?.id ?? "local-deterministic";
  const cap = model?.maxOutputTokens ?? 8_000;
  const maxOutputTokens = Math.min(request.maxOutputTokens ?? cap, cap || 8_000) || 8_000;
  return { modelId, messages: request.messages, maxOutputTokens };
}
