/**
 * Cloud provider base (Sprint 5.1). Anthropic, OpenAI and Gemini share one adapter shape: they
 * delegate to an INJECTED client (`CloudClient`) rather than importing a vendor SDK, so this
 * package installs nothing and stays deterministic. When no client is wired (the case in 5.1 —
 * network wiring is a later sprint), the provider reports `available: false` and throws
 * `ProviderNotConfiguredError` on use, exactly as the failover/health paths expect.
 *
 * Server code (apps/web/server/ai) is the single place that would construct a real client from
 * env keys and pass it here — keys never live in this package (06_AI_Architecture §1: server-side
 * only).
 */
import type { ProviderName } from "../config/models";
import { computeCost } from "../config/costs";
import { estimateTokens } from "../text";
import {
  type HealthStatus,
  type Provider,
  type ProviderGenerateInput,
  type ProviderGenerateResult,
  ProviderNotConfiguredError,
  type StreamChunk,
} from "./types";

/** Minimal client surface a cloud adapter needs; the real SDK is adapted to this in server code. */
export interface CloudClient {
  generate(input: ProviderGenerateInput): Promise<ProviderGenerateResult>;
  stream?(input: ProviderGenerateInput): AsyncIterable<StreamChunk>;
  embed?(texts: string[], dims?: number): Promise<number[][]>;
  ping?(): Promise<boolean>;
}

export class CloudProvider implements Provider {
  constructor(
    readonly name: ProviderName,
    private readonly client: CloudClient | null,
    private readonly caps: { structured: boolean; tools: boolean } = {
      structured: true,
      tools: true,
    },
    private readonly now: () => Date = () => new Date(),
  ) {}

  get available(): boolean {
    return this.client !== null;
  }

  private requireClient(): CloudClient {
    if (!this.client) throw new ProviderNotConfiguredError(this.name);
    return this.client;
  }

  async generate(input: ProviderGenerateInput): Promise<ProviderGenerateResult> {
    return this.requireClient().generate(input);
  }

  async *stream(input: ProviderGenerateInput): AsyncIterable<StreamChunk> {
    const client = this.requireClient();
    if (client.stream) {
      yield* client.stream(input);
      return;
    }
    // Fall back to a single-chunk stream from generate.
    const result = await client.generate(input);
    yield { delta: result.text, done: false };
    yield { delta: "", done: true, usage: result.usage };
  }

  async embed(texts: string[], dims?: number): Promise<number[][]> {
    const client = this.requireClient();
    if (!client.embed) throw new ProviderNotConfiguredError(this.name);
    return client.embed(texts, dims);
  }

  async healthCheck(): Promise<HealthStatus> {
    const checkedAt = this.now().toISOString();
    if (!this.client) {
      return {
        provider: this.name,
        state: "unavailable",
        detail: "no client configured",
        checkedAt,
      };
    }
    const ok = this.client.ping ? await this.client.ping().catch(() => false) : true;
    return {
      provider: this.name,
      state: ok ? "healthy" : "degraded",
      detail: ok ? "client configured" : "ping failed",
      checkedAt,
    };
  }

  estimateCost(input: ProviderGenerateInput): number {
    const inputTokens = input.messages.reduce((s, m) => s + estimateTokens(m.content), 0);
    return computeCost(input.modelId, inputTokens, input.maxOutputTokens);
  }

  supportsStructuredOutputs(): boolean {
    return this.caps.structured;
  }

  supportsToolCalling(): boolean {
    return this.caps.tools;
  }
}
