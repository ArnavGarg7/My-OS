/**
 * Groq provider (Sprint 5.3). Config-driven wrapper over CloudProvider — Groq is the low-latency
 * cloud backend in the Provider Policy's "fast" tier. The real client (fetch-based, OpenAI-compatible
 * API) is injected by server code from the env key; no vendor SDK is imported here, so the package
 * stays pure and dependency-free.
 */
import { CloudProvider, type CloudClient } from "../cloud";

export function createGroqProvider(
  client: CloudClient | null = null,
  now?: () => Date,
): CloudProvider {
  return new CloudProvider("groq", client, { structured: true, tools: true }, now);
}
