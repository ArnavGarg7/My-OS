import "server-only";
import { createAiEngine, type AiEngine } from "@myos/ai";

/**
 * Process-wide AI engine (Sprint 5.1). One deterministic, offline platform instance shared across
 * requests. No cloud clients are wired in 5.1 — the engine runs the local tier, so the whole
 * pipeline (gateway → context → budget → tools → provider → validation → telemetry) works with no
 * keys and no network. A later sprint constructs cloud clients from env and passes them here.
 *
 * The real-`sleep` injection means retry backoff actually waits in production; tests inject an
 * instant sleep at the core level.
 */
const globalForAi = globalThis as unknown as { __myosAiEngine?: AiEngine };

export function getAiEngine(): AiEngine {
  return (globalForAi.__myosAiEngine ??= createAiEngine({
    tier: "local",
    sleep: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
  }));
}
