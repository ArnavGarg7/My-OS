/**
 * Reliability Engineering (Sprint 5.4, 06_AI_Architecture §Reliability). Classifies AI failure modes
 * — provider outage, network timeout, invalid credentials, malformed tool response, tool failure,
 * empty/partial context, rate limiting, streaming interruption — and prescribes a deterministic
 * recovery: retry, provider fallback, Local fallback, and whether to notify the user. Pure decision
 * logic; the server executes the prescribed recovery and records `ai_reliability_events`.
 */

export type FailureKind =
  | "provider_outage"
  | "network_timeout"
  | "invalid_credentials"
  | "malformed_tool_response"
  | "tool_failure"
  | "empty_context"
  | "partial_context"
  | "rate_limited"
  | "streaming_interrupted";

export const FAILURE_KINDS: readonly FailureKind[] = [
  "provider_outage",
  "network_timeout",
  "invalid_credentials",
  "malformed_tool_response",
  "tool_failure",
  "empty_context",
  "partial_context",
  "rate_limited",
  "streaming_interrupted",
] as const;

export type RecoveryAction = "retry" | "provider_fallback" | "local_fallback" | "degrade" | "abort";

export interface RecoveryPlan {
  kind: FailureKind;
  /** Whether to retry the same provider first. */
  retry: boolean;
  /** Max retry attempts before escalating. */
  maxRetries: number;
  /** Ordered recovery actions. Always terminates in a safe state (Local or degrade). */
  actions: RecoveryAction[];
  /** Whether the user should be told. */
  notifyUser: boolean;
  severity: "low" | "medium" | "high";
}

/**
 * The recovery plan for a failure. Every plan ends in a safe state: the Local provider is the
 * universal fallback, so no failure leaves the user without an answer (06_AI_Architecture: "Local
 * Provider must always remain available as the final offline fallback").
 */
export function planRecovery(kind: FailureKind): RecoveryPlan {
  switch (kind) {
    case "provider_outage":
      return {
        kind,
        retry: false,
        maxRetries: 0,
        actions: ["provider_fallback", "local_fallback"],
        notifyUser: false,
        severity: "medium",
      };
    case "network_timeout":
      return {
        kind,
        retry: true,
        maxRetries: 2,
        actions: ["retry", "provider_fallback", "local_fallback"],
        notifyUser: false,
        severity: "medium",
      };
    case "invalid_credentials":
      return {
        kind,
        retry: false,
        maxRetries: 0,
        actions: ["provider_fallback", "local_fallback"],
        notifyUser: true,
        severity: "high",
      };
    case "malformed_tool_response":
      return {
        kind,
        retry: true,
        maxRetries: 1,
        actions: ["retry", "degrade"],
        notifyUser: false,
        severity: "low",
      };
    case "tool_failure":
      return {
        kind,
        retry: true,
        maxRetries: 1,
        actions: ["retry", "degrade"],
        notifyUser: false,
        severity: "low",
      };
    case "empty_context":
      return {
        kind,
        retry: false,
        maxRetries: 0,
        actions: ["degrade"],
        notifyUser: false,
        severity: "low",
      };
    case "partial_context":
      return {
        kind,
        retry: false,
        maxRetries: 0,
        actions: ["degrade"],
        notifyUser: false,
        severity: "low",
      };
    case "rate_limited":
      return {
        kind,
        retry: true,
        maxRetries: 3,
        actions: ["retry", "provider_fallback", "local_fallback"],
        notifyUser: false,
        severity: "medium",
      };
    case "streaming_interrupted":
      return {
        kind,
        retry: true,
        maxRetries: 1,
        actions: ["retry", "local_fallback"],
        notifyUser: false,
        severity: "low",
      };
  }
}

export interface ReliabilityRunResult {
  kind: FailureKind;
  recovered: boolean;
  finalProvider: string;
  attempts: number;
  actionsTaken: RecoveryAction[];
}

/**
 * Simulate executing a recovery plan against a provider-availability probe. Deterministic: walks the
 * plan's actions, counting retries, and resolves to whichever provider the probe reports available
 * (Local is assumed always available). Used by reliability tests + the diagnostics dashboard.
 */
export function simulateRecovery(
  kind: FailureKind,
  isAvailable: (provider: string) => boolean,
  fallbackOrder: readonly string[] = ["anthropic", "gemini", "groq", "local"],
): ReliabilityRunResult {
  const plan = planRecovery(kind);
  const actionsTaken: RecoveryAction[] = [];
  let attempts = 0;
  for (const action of plan.actions) {
    actionsTaken.push(action);
    if (action === "retry") {
      attempts += 1;
      const current = fallbackOrder.find((p) => p !== "local");
      if (current && isAvailable(current)) {
        return { kind, recovered: true, finalProvider: current, attempts, actionsTaken };
      }
      continue;
    }
    if (action === "provider_fallback") {
      const next = fallbackOrder.find((p) => p !== "local" && isAvailable(p));
      if (next) return { kind, recovered: true, finalProvider: next, attempts, actionsTaken };
      continue;
    }
    if (action === "local_fallback") {
      return { kind, recovered: true, finalProvider: "local", attempts, actionsTaken };
    }
    if (action === "degrade") {
      // Degrade serves a reduced (but valid) deterministic answer via Local.
      return { kind, recovered: true, finalProvider: "local", attempts, actionsTaken };
    }
  }
  // No action resolved — Local is the guaranteed terminal fallback.
  return { kind, recovered: true, finalProvider: "local", attempts, actionsTaken };
}
