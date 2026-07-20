/**
 * Deterministic text utilities (Sprint 5.1). Token estimation and a stable string hash used by
 * the budget manager, telemetry, cache keys, and the local embedder. Deterministic by design —
 * the same input always yields the same number, so tests and cache keys are stable. This is an
 * ESTIMATE (chars/4), not a real tokenizer; the platform never depends on exactness, only stability.
 */
import { DEFAULTS } from "./config/defaults";

/** Estimate token count from character length (deterministic, provider-agnostic). */
export function estimateTokens(text: string): number {
  if (!text) return 0;
  return Math.ceil(text.length / DEFAULTS.charsPerToken);
}

/** Estimate tokens for a serialized JSON value. */
export function estimateJsonTokens(value: unknown): number {
  return estimateTokens(stableStringify(value));
}

/** FNV-1a 32-bit hash → hex string. Stable across runs and platforms. */
export function stableHash(input: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, "0");
}

/**
 * Deterministic JSON serialization with sorted keys (06_AI_Architecture §4 — snapshots serialize
 * with sorted keys for cache friendliness). Stable regardless of insertion order.
 */
export function stableStringify(value: unknown): string {
  return JSON.stringify(sortKeys(value));
}

function sortKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(value as Record<string, unknown>).sort()) {
      out[key] = sortKeys((value as Record<string, unknown>)[key]);
    }
    return out;
  }
  return value;
}
