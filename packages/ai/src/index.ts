/**
 * @myos/ai — the production AI Core Platform (Phase 5, Sprint 5.1). A provider-agnostic pipeline
 * that every future AI capability composes rather than reinventing:
 *
 *   Application → Gateway → Context → Budget → Tools → Provider → Structured Validation → Telemetry
 *
 * This sprint ships the PLATFORM, not an assistant — no end-user AI is exposed. The default engine
 * is fully deterministic and offline (Local provider), so the platform installs no vendor SDK and
 * runs identically in tests and CI. Keys and real clients are wired server-side in a later sprint.
 *
 * The historical `AiService` seam (Sprint 1.1) is preserved for the disabled/local_only path.
 */
export interface AiService {
  readonly enabled: boolean;
}

export const disabledAiService: AiService = {
  enabled: false,
};

export { AiEngine, createAiEngine, type AiEngineConfig } from "./engine";

// Sub-platform barrels (also available as subpath exports, e.g. `@myos/ai/gateway`).
export * as config from "./config";
export * as schemas from "./schemas";
export * as gateway from "./gateway";
export * as providers from "./providers";
export * as prompts from "./prompts";
export * as context from "./context";
export * as tools from "./tools";
export * as memory from "./memory";
export * as telemetry from "./telemetry";
export * as streaming from "./streaming";
export * as structured from "./structured";
export * as cost from "./cost";
export * as evals from "./evals";
export * as observability from "./observability";
export * as performance from "./performance";
export * as security from "./security";
export * as benchmark from "./benchmark";
export * as reliability from "./reliability";

export { estimateTokens, stableStringify, stableHash } from "./text";
