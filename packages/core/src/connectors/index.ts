/**
 * @myos/core/connectors — the provider-agnostic Connector Platform (Sprint 6.4, Phase 6). Turns
 * external services into NORMALIZED events for the existing Event Intelligence → Prediction →
 * Automation → Chief pipeline. **Connectors synchronize and normalize; they never interpret.** Pure,
 * deterministic, replayable, read-first, permission-scoped. No credentials, no IO, no AI here — the
 * server binds real OAuth/HTTP + the encrypted credential vault.
 */
export * from "./types";
export { CONNECTOR_PROVIDERS, getProvider, providersByCategory } from "./registry";
export { canTransition, transition, isConnected } from "./lifecycle";
export {
  normalize,
  normalizeBatch,
  normalizedKinds,
  type RawPayload,
  type NormalizeDeps,
} from "./normalization";
export { planSync, resolveSync } from "./sync";
export { computeHealth, healthBand, backoffMs, type HealthInput } from "./health";
export { connectSchema, syncInputSchema, disconnectSchema, rawPayloadSchema } from "./schemas";
