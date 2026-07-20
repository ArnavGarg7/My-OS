/**
 * Response normalization (Sprint 5.1). Converts a provider result into the platform's canonical
 * `AiResponse`, attaching the resolved model + provider. Pure.
 */
import type { ProviderGenerateResult } from "../providers/types";
import { aiResponseSchema, type AiResponse } from "../schemas";

export function normalizeResponse(
  result: ProviderGenerateResult,
  modelKey: string,
  provider: string,
  parsed?: unknown,
): AiResponse {
  return aiResponseSchema.parse({
    text: result.text,
    model: modelKey,
    provider,
    finishReason: result.finishReason,
    usage: result.usage,
    ...(parsed !== undefined ? { parsed } : {}),
  });
}
