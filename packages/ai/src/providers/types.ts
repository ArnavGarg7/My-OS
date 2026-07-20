/**
 * Provider contract (Sprint 5.1, 06_AI_Architecture §Provider Framework). Every provider —
 * Anthropic, OpenAI, Gemini, Local — implements this identical surface, so switching providers is
 * a configuration change, never a code change. The gateway talks only to this interface.
 *
 * Providers are constructed with their dependencies injected (an API client for cloud providers,
 * nothing for Local). No provider imports a vendor SDK at module load — cloud adapters receive a
 * client, so this package stays dependency-free and deterministic in tests.
 */
import type { ProviderName } from "../config/models";
import type { Message, Usage } from "../schemas";

/** What the gateway hands a provider: a resolved model + prepared messages. */
export interface ProviderGenerateInput {
  modelId: string;
  messages: Message[];
  maxOutputTokens: number;
}

export interface ProviderGenerateResult {
  text: string;
  finishReason: "stop" | "max_tokens" | "tool_use" | "refusal" | "error";
  usage: Usage;
}

/** A single streamed chunk. `done` marks the terminal chunk carrying final usage. */
export interface StreamChunk {
  delta: string;
  done: boolean;
  usage?: Usage;
}

export type HealthState = "healthy" | "degraded" | "unavailable";

export interface HealthStatus {
  provider: ProviderName;
  state: HealthState;
  /** Human-readable detail (e.g. "no api key configured"). */
  detail: string;
  checkedAt: string;
}

export interface Provider {
  readonly name: ProviderName;
  /** Whether the provider can serve requests now (client configured, key present). */
  readonly available: boolean;
  generate(input: ProviderGenerateInput): Promise<ProviderGenerateResult>;
  stream(input: ProviderGenerateInput): AsyncIterable<StreamChunk>;
  embed(texts: string[], dims?: number): Promise<number[][]>;
  healthCheck(): Promise<HealthStatus>;
  estimateCost(input: ProviderGenerateInput): number;
  supportsStructuredOutputs(): boolean;
  supportsToolCalling(): boolean;
}

/** Thrown when a cloud provider is invoked without a configured client. */
export class ProviderNotConfiguredError extends Error {
  constructor(public readonly provider: ProviderName) {
    super(
      `Provider "${provider}" is not configured (no client/key). Use the local provider or configure ${provider}.`,
    );
    this.name = "ProviderNotConfiguredError";
  }
}
