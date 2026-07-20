/**
 * Gemini provider (Sprint 5.1). Config-driven wrapper over CloudProvider — the third interchangeable
 * cloud backend. Real client injected by server code; no vendor SDK imported here.
 */
import { CloudProvider, type CloudClient } from "../cloud";

export function createGeminiProvider(
  client: CloudClient | null = null,
  now?: () => Date,
): CloudProvider {
  return new CloudProvider("gemini", client, { structured: true, tools: true }, now);
}
