/**
 * Provider Policy Engine (Sprint 5.2). Chooses a provider by CAPABILITY, not by feature — an
 * ordered preference list per capability, with automatic fallback to the Local provider (offline).
 * No feature-specific branching: a feature declares what it needs (reasoning / fast / planning /
 * summaries) and the policy resolves a concrete, available provider. Deterministic given the
 * availability + budget inputs. Local is always the terminal fallback, so the platform never fails
 * for lack of a cloud provider.
 *
 * "groq" appears in the ordering as a future cloud backend; until it's registered it's simply
 * unavailable and the policy falls through — exactly the intended behaviour.
 */
export type PolicyCapability = "reasoning" | "fast" | "planning" | "summaries" | "offline";

/** Ordered provider preference per capability (06_AI_Architecture §2 + Sprint 5.2 policy table). */
export const PROVIDER_POLICIES: Record<PolicyCapability, string[]> = {
  reasoning: ["anthropic", "gemini", "groq", "local"],
  fast: ["groq", "gemini", "anthropic", "local"],
  planning: ["anthropic", "gemini", "local"],
  summaries: ["gemini", "groq", "anthropic", "local"],
  offline: ["local"],
};

export interface PolicyInputs {
  /** Is a provider currently available (client configured + healthy)? */
  isAvailable: (provider: string) => boolean;
  /** Is there budget headroom for a paid provider? When false, only local is allowed. */
  budgetOk?: boolean;
  /** Force offline (local_only mode). */
  offline?: boolean;
}

export interface PolicyDecision {
  provider: string;
  /** Providers skipped before landing on `provider`, for explainability/telemetry. */
  skipped: string[];
  reason: "preferred" | "fallback" | "offline" | "budget";
}

/** Resolve the provider for a capability. Always returns a decision (local is terminal). */
export function selectProvider(capability: PolicyCapability, inputs: PolicyInputs): PolicyDecision {
  if (inputs.offline) return { provider: "local", skipped: [], reason: "offline" };

  const order = PROVIDER_POLICIES[capability];
  const skipped: string[] = [];
  for (const provider of order) {
    if (provider === "local")
      return { provider: "local", skipped, reason: skipped.length ? "fallback" : "preferred" };
    // Paid providers require budget headroom.
    if (inputs.budgetOk === false) {
      skipped.push(provider);
      continue;
    }
    if (inputs.isAvailable(provider)) {
      return { provider, skipped, reason: skipped.length ? "fallback" : "preferred" };
    }
    skipped.push(provider);
  }
  // Should be unreachable (local terminates every list), but stay safe.
  return { provider: "local", skipped, reason: inputs.budgetOk === false ? "budget" : "fallback" };
}
