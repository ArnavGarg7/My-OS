/**
 * Model registry (Sprint 5.1). Model IDs are CONFIG, not code constants (06_AI_Architecture §2),
 * so upgrades are a one-line change here. Each entry names the provider, the capabilities it can
 * serve, and its per-million-token pricing. The `local` provider's pseudo-model backs the fully
 * deterministic default path — the platform is usable with no external provider configured.
 *
 * Pure data. No SDK imports, no network. The gateway and provider router read this registry.
 */
import type { Capability } from "./capabilities";

export type ProviderName = "anthropic" | "openai" | "gemini" | "groq" | "local";

export interface ModelConfig {
  /** Stable model id passed to the provider (e.g. "claude-opus-4-8"). */
  id: string;
  provider: ProviderName;
  /** Human label for dashboards. */
  label: string;
  /** Capabilities this model can serve. */
  capabilities: Capability[];
  /** Context window (input tokens). */
  contextWindow: number;
  /** Max output tokens. */
  maxOutputTokens: number;
  /** USD per 1M input / output tokens. Local is free. */
  inputCostPerMTok: number;
  outputCostPerMTok: number;
  /** Whether this model can emit structured (schema-constrained) JSON. */
  structuredOutputs: boolean;
  /** Whether this model supports tool calling. */
  toolCalling: boolean;
}

/**
 * The canonical model catalogue. The Claude models are the intended production defaults
 * (06_AI_Architecture §2); OpenAI/Gemini entries make the platform provider-agnostic; `local`
 * is the deterministic offline default. Editing an `id` here re-points every consumer.
 */
export const MODELS = {
  "claude-opus-4-8": {
    id: "claude-opus-4-8",
    provider: "anthropic",
    label: "Claude Opus 4.8",
    capabilities: ["reasoning", "summarization", "extraction", "classification"],
    contextWindow: 200_000,
    maxOutputTokens: 64_000,
    inputCostPerMTok: 5,
    outputCostPerMTok: 25,
    structuredOutputs: true,
    toolCalling: true,
  },
  "claude-haiku-4-5": {
    id: "claude-haiku-4-5",
    provider: "anthropic",
    label: "Claude Haiku 4.5",
    capabilities: ["classification", "extraction", "summarization"],
    contextWindow: 200_000,
    maxOutputTokens: 32_000,
    inputCostPerMTok: 1,
    outputCostPerMTok: 5,
    structuredOutputs: true,
    toolCalling: true,
  },
  "claude-sonnet-5": {
    id: "claude-sonnet-5",
    provider: "anthropic",
    label: "Claude Sonnet 5",
    capabilities: ["reasoning", "summarization", "extraction", "classification"],
    contextWindow: 200_000,
    maxOutputTokens: 64_000,
    inputCostPerMTok: 3,
    outputCostPerMTok: 15,
    structuredOutputs: true,
    toolCalling: true,
  },
  "gemini-2-5-flash": {
    id: "gemini-2-5-flash",
    provider: "gemini",
    label: "Gemini 2.5 Flash",
    capabilities: ["summarization", "classification", "extraction", "reasoning"],
    contextWindow: 1_000_000,
    maxOutputTokens: 8_000,
    inputCostPerMTok: 0.3,
    outputCostPerMTok: 2.5,
    structuredOutputs: true,
    toolCalling: true,
  },
  "gemini-2-5-pro": {
    id: "gemini-2-5-pro",
    provider: "gemini",
    label: "Gemini 2.5 Pro",
    capabilities: ["reasoning", "summarization", "extraction", "classification"],
    contextWindow: 1_000_000,
    maxOutputTokens: 8_000,
    inputCostPerMTok: 1.25,
    outputCostPerMTok: 10,
    structuredOutputs: true,
    toolCalling: true,
  },
  "groq-llama-3-3-70b": {
    id: "llama-3.3-70b-versatile",
    provider: "groq",
    label: "Groq Llama 3.3 70B",
    capabilities: ["summarization", "classification", "extraction", "reasoning"],
    contextWindow: 128_000,
    maxOutputTokens: 8_000,
    inputCostPerMTok: 0.59,
    outputCostPerMTok: 0.79,
    structuredOutputs: true,
    toolCalling: true,
  },
  "gpt-4-1-mini": {
    id: "gpt-4.1-mini",
    provider: "openai",
    label: "GPT-4.1 mini",
    capabilities: ["reasoning", "summarization", "extraction", "classification"],
    contextWindow: 1_000_000,
    maxOutputTokens: 16_000,
    inputCostPerMTok: 0.4,
    outputCostPerMTok: 1.6,
    structuredOutputs: true,
    toolCalling: true,
  },
  "voyage-3-5-lite": {
    id: "voyage-3-5-lite",
    provider: "anthropic",
    label: "Voyage 3.5 Lite",
    capabilities: ["embedding"],
    contextWindow: 32_000,
    maxOutputTokens: 0,
    inputCostPerMTok: 0.02,
    outputCostPerMTok: 0,
    structuredOutputs: false,
    toolCalling: false,
  },
  "local-deterministic": {
    id: "local-deterministic",
    provider: "local",
    label: "Local (deterministic)",
    capabilities: [
      "reasoning",
      "summarization",
      "extraction",
      "classification",
      "embedding",
      "search",
    ],
    contextWindow: 32_000,
    maxOutputTokens: 8_000,
    inputCostPerMTok: 0,
    outputCostPerMTok: 0,
    structuredOutputs: true,
    toolCalling: true,
  },
} as const satisfies Record<string, ModelConfig>;

export type ModelKey = keyof typeof MODELS;

/** Look a model up by key; returns null if unknown (callers decide the fallback). */
export function getModel(key: string): ModelConfig | null {
  return (MODELS as Record<string, ModelConfig>)[key] ?? null;
}

/** All models that can serve a capability, cheapest input cost first. */
export function modelsForCapability(cap: Capability): ModelConfig[] {
  return Object.values(MODELS as Record<string, ModelConfig>)
    .filter((m) => m.capabilities.includes(cap))
    .sort((a, b) => a.inputCostPerMTok - b.inputCostPerMTok);
}
