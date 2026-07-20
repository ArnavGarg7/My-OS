/**
 * AI settings model (Sprint 5.3). The user-facing configuration for the AI layer — provider status,
 * budget, policy, memory + privacy toggles. Pure data + defaults; the server persists it and reads
 * keys from env (never here). No secrets live in this module.
 */

export interface ProviderStatus {
  provider: string;
  /** Whether a key is configured (env). Never the key itself. */
  configured: boolean;
  state: "healthy" | "degraded" | "unavailable";
  models: string[];
  detail: string;
}

export interface AiSettings {
  /** Active tier (best | economy | local). */
  tier: "best" | "economy" | "local";
  /** Soft/hard daily budget in USD. */
  softDailyUsd: number;
  hardDailyUsd: number;
  /** Whether journal content may enter AI context. */
  journalInContext: boolean;
  /** Global offline switch (local_only). */
  localOnly: boolean;
  /** Whether the assistant may propose permanent memories (always requires confirmation). */
  memoryProposalsEnabled: boolean;
}

export function defaultAiSettings(): AiSettings {
  return {
    tier: "local",
    softDailyUsd: 2,
    hardDailyUsd: 5,
    journalInContext: false,
    localOnly: false,
    memoryProposalsEnabled: true,
  };
}
