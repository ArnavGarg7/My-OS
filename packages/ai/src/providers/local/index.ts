/**
 * Local provider (Sprint 5.1) — the fully deterministic, offline default. It runs the entire
 * platform pipeline (gateway → context → budget → tools → provider → validation → telemetry)
 * with zero network and perfectly reproducible output, which is why every test and the
 * `local_only` mode use it. It performs NO business logic — it echoes/derives from its input
 * deterministically so the surrounding infrastructure can be exercised and asserted.
 *
 * `generate` returns a stable transform of the conversation; `embed` produces a deterministic
 * hash-based vector (the same approach the Knowledge graph used — no ML). Optional scripted
 * responses let tests pin exact output by input hash.
 */
import { computeCost } from "../../config/costs";
import { estimateTokens, stableHash, stableStringify } from "../../text";
import type {
  HealthStatus,
  Provider,
  ProviderGenerateInput,
  ProviderGenerateResult,
  StreamChunk,
} from "../types";

export interface LocalProviderOptions {
  /** Fixed responses keyed by input hash — lets tests pin exact output. */
  scripted?: Record<string, string> | undefined;
  /** Clock injection for deterministic timestamps. */
  now?: (() => Date) | undefined;
}

export class LocalProvider implements Provider {
  readonly name = "local" as const;
  readonly available = true;
  private readonly scripted: Record<string, string>;
  private readonly now: () => Date;

  constructor(opts: LocalProviderOptions = {}) {
    this.scripted = opts.scripted ?? {};
    this.now = opts.now ?? (() => new Date());
  }

  private render(input: ProviderGenerateInput): string {
    const key = stableHash(stableStringify(input.messages));
    if (this.scripted[key] !== undefined) return this.scripted[key];
    const lastUser = [...input.messages].reverse().find((m) => m.role === "user");
    const summary = (lastUser?.content ?? "").slice(0, 280);
    return `[local:${input.modelId}] ${summary}`;
  }

  async generate(input: ProviderGenerateInput): Promise<ProviderGenerateResult> {
    const full = this.render(input);
    const inputTokens = input.messages.reduce((s, m) => s + estimateTokens(m.content), 0);
    const capped = full.slice(0, input.maxOutputTokens * 4);
    const outputTokens = estimateTokens(capped);
    return {
      text: capped,
      finishReason: capped.length < full.length ? "max_tokens" : "stop",
      usage: { inputTokens, outputTokens, cachedTokens: 0 },
    };
  }

  async *stream(input: ProviderGenerateInput): AsyncIterable<StreamChunk> {
    const result = await this.generate(input);
    // Deterministic word-level streaming.
    const words = result.text.split(/(\s+)/).filter(Boolean);
    for (const w of words) yield { delta: w, done: false };
    yield { delta: "", done: true, usage: result.usage };
  }

  async embed(texts: string[], dims = 256): Promise<number[][]> {
    return texts.map((t) => embedDeterministic(t, dims));
  }

  async healthCheck(): Promise<HealthStatus> {
    return {
      provider: "local",
      state: "healthy",
      detail: "deterministic local provider — always available",
      checkedAt: this.now().toISOString(),
    };
  }

  estimateCost(input: ProviderGenerateInput): number {
    const inputTokens = input.messages.reduce((s, m) => s + estimateTokens(m.content), 0);
    return computeCost(input.modelId, inputTokens, input.maxOutputTokens);
  }

  supportsStructuredOutputs(): boolean {
    return true;
  }

  supportsToolCalling(): boolean {
    return true;
  }
}

/**
 * Deterministic embedding: hash each token into buckets, then L2-normalize. No ML, no network —
 * stable and comparable via cosine, which is all the retrieval infrastructure needs in 5.1.
 */
export function embedDeterministic(text: string, dims = 256): number[] {
  const vec = new Array<number>(dims).fill(0);
  const tokens = text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
  for (const tok of tokens) {
    const h = parseInt(stableHash(tok), 16);
    const i1 = h % dims;
    const i2 = (h >> 8) % dims;
    vec[i1] = (vec[i1] ?? 0) + 1;
    vec[i2] = (vec[i2] ?? 0) + 0.5;
  }
  const norm = Math.sqrt(vec.reduce((s, x) => s + x * x, 0)) || 1;
  return vec.map((x) => x / norm);
}
