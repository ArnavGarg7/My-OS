/**
 * Streaming Infrastructure (Sprint 5.1, 06_AI_Architecture §Streaming). A reusable stream manager
 * over a provider's chunk iterator: accumulation, cancellation, timeout, and terminal usage
 * capture. Every interactive AI feature streams through this — no feature re-implements SSE
 * handling. Deterministic given an injected clock; cancellation is cooperative.
 */
import type { StreamChunk } from "../providers/types";
import type { Usage } from "../schemas";

export interface StreamState {
  text: string;
  chunks: number;
  done: boolean;
  cancelled: boolean;
  usage: Usage | null;
}

export interface ConsumeOptions {
  /** Called with the running text on each delta. */
  onDelta?: (delta: string, text: string) => void;
  /** Cooperative cancellation — checked before each chunk. */
  signal?: { aborted: boolean };
  /** Wall-clock timeout in ms; needs `now`. Throws StreamTimeoutError when exceeded. */
  timeoutMs?: number;
  now?: () => number;
}

export class StreamTimeoutError extends Error {
  constructor(public readonly ms: number) {
    super(`Stream exceeded ${ms}ms`);
    this.name = "StreamTimeoutError";
  }
}

/**
 * Drive a provider chunk stream to completion (or cancellation/timeout), accumulating text and the
 * final usage. Returns the terminal `StreamState`.
 */
export async function consumeStream(
  stream: AsyncIterable<StreamChunk>,
  opts: ConsumeOptions = {},
): Promise<StreamState> {
  const state: StreamState = { text: "", chunks: 0, done: false, cancelled: false, usage: null };
  const now = opts.now ?? (() => Date.now());
  const start = now();
  for await (const chunk of stream) {
    if (opts.signal?.aborted) {
      state.cancelled = true;
      break;
    }
    if (opts.timeoutMs !== undefined && now() - start > opts.timeoutMs) {
      throw new StreamTimeoutError(opts.timeoutMs);
    }
    if (chunk.delta) {
      state.text += chunk.delta;
      state.chunks += 1;
      opts.onDelta?.(chunk.delta, state.text);
    }
    if (chunk.done) {
      state.done = true;
      state.usage = chunk.usage ?? null;
      break;
    }
  }
  return state;
}

export type { StreamChunk };
