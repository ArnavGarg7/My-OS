/**
 * Policy Engine (Sprint 6.3, spec §Policy Engine / §Trusted Automations). Deterministically decides
 * whether a proposal may auto-execute (trusted) or must wait for the user. High-risk automations can
 * NEVER be trusted — a trust setting on them is ignored (proposal-first is enforced). Pure.
 */
import type { Automation, Policy } from "./types";

export interface PolicyDecision {
  policy: Policy;
  requiresApproval: boolean;
  reason: string;
}

/** Resolve the effective policy: a user override, clamped so only LOW-risk automations can be trusted. */
export function resolvePolicy(automation: Automation, userPolicy?: Policy): PolicyDecision {
  const requested = userPolicy ?? automation.defaultPolicy;
  // Trust is only honoured for low-risk automations; medium/high always ask.
  if (requested === "trusted" && automation.risk !== "low") {
    return {
      policy: "always_ask",
      requiresApproval: true,
      reason: `"${automation.name}" is ${automation.risk} risk — trust is not permitted; approval required.`,
    };
  }
  if (requested === "disabled") {
    return { policy: "disabled", requiresApproval: true, reason: "Automation disabled by policy." };
  }
  if (requested === "trusted") {
    return {
      policy: "trusted",
      requiresApproval: false,
      reason: "Trusted low-risk automation — runs within policy.",
    };
  }
  return {
    policy: requested,
    requiresApproval: true,
    reason: "Approval required before execution.",
  };
}

/** The automations a user is allowed to mark trusted (low-risk only). */
export function trustableAutomations(automations: readonly Automation[]): Automation[] {
  return automations.filter((a) => a.risk === "low" && a.reversible);
}
