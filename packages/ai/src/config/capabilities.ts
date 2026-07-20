/**
 * Capability-based routing (Sprint 5.1, 06_AI_Architecture §Provider Framework). Features route
 * by CAPABILITY, not by hard-coded provider — "this request needs reasoning" rather than "send to
 * Anthropic". The provider router maps a capability to a configured model, so switching providers
 * is a config change. Pure enum + tier config.
 */

export const CAPABILITIES = [
  "reasoning",
  "summarization",
  "extraction",
  "classification",
  "embedding",
  "search",
  "vision",
  "speech",
] as const;

export type Capability = (typeof CAPABILITIES)[number];

/** Tiers expose a coarse quality/cost choice (06_AI_Architecture §2: Best vs Economy). */
export type Tier = "best" | "economy" | "local";

/**
 * Per-tier, the preferred model key for each capability. `local` is fully offline/deterministic.
 * The provider router consults this map, then falls back to any model that serves the capability.
 * Model keys reference `MODELS` in ./models.
 */
export const TIER_ROUTES: Record<Tier, Partial<Record<Capability, string>>> = {
  best: {
    reasoning: "claude-opus-4-8",
    summarization: "claude-opus-4-8",
    extraction: "claude-haiku-4-5",
    classification: "claude-haiku-4-5",
    embedding: "voyage-3-5-lite",
    search: "local-deterministic",
  },
  economy: {
    reasoning: "claude-sonnet-5",
    summarization: "claude-haiku-4-5",
    extraction: "claude-haiku-4-5",
    classification: "claude-haiku-4-5",
    embedding: "voyage-3-5-lite",
    search: "local-deterministic",
  },
  local: {
    reasoning: "local-deterministic",
    summarization: "local-deterministic",
    extraction: "local-deterministic",
    classification: "local-deterministic",
    embedding: "local-deterministic",
    search: "local-deterministic",
  },
};

export function isCapability(value: string): value is Capability {
  return (CAPABILITIES as readonly string[]).includes(value);
}
