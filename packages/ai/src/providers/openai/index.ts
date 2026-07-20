/**
 * OpenAI provider (Sprint 5.1). Config-driven wrapper over CloudProvider — present so the platform
 * is genuinely provider-agnostic (switching primary is a config change). The real client is
 * injected by server code; no vendor SDK is imported here.
 */
import { CloudProvider, type CloudClient } from "../cloud";

export function createOpenAiProvider(
  client: CloudClient | null = null,
  now?: () => Date,
): CloudProvider {
  return new CloudProvider("openai", client, { structured: true, tools: true }, now);
}
