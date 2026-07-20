/**
 * Anthropic provider (Sprint 5.1). A thin, config-driven wrapper over the shared CloudProvider.
 * Anthropic is the intended PRIMARY provider (06_AI_Architecture §2: claude-opus-4-8 for reasoning,
 * claude-haiku-4-5 for lightweight tasks, Voyage for embeddings). The real SDK client is injected
 * by server code from env keys — this file imports no vendor SDK, so the package stays pure.
 */
import { CloudProvider, type CloudClient } from "../cloud";

export function createAnthropicProvider(
  client: CloudClient | null = null,
  now?: () => Date,
): CloudProvider {
  return new CloudProvider("anthropic", client, { structured: true, tools: true }, now);
}
