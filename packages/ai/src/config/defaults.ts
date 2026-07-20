/**
 * Platform defaults (Sprint 5.1). Timeouts, retry policy, and the context token budget the
 * Budget Manager enforces (06_AI_Architecture §4 hard cap 8k input tokens). Pure constants.
 */

export const DEFAULTS = {
  /** Hard cap on assembled context input tokens (excludes cached system prompt). */
  contextTokenBudget: 8_000,
  /** Interactive request timeout (ms). */
  interactiveTimeoutMs: 60_000,
  /** Background job timeout (ms). */
  backgroundTimeoutMs: 300_000,
  /** Max provider retries on retryable errors. */
  maxRetries: 2,
  /** Base backoff (ms) for retry n → base * 2^n. */
  retryBackoffBaseMs: 500,
  /** Assistant agent loop iteration cap (06_AI_Architecture §5). */
  maxAgentIterations: 8,
  /** Default tier when none configured. */
  defaultTier: "local" as const,
  /** Structured-output repair attempts before falling back (06_AI_Architecture §15). */
  maxRepairAttempts: 1,
  /** Approximate characters per token, for the deterministic token estimator. */
  charsPerToken: 4,
} as const;
