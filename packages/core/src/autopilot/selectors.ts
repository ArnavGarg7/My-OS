/**
 * Autopilot selectors (Sprint 6.3). Pure read-model views over proposals for the server's
 * `autopilot.*` endpoints and the Chief. No IO.
 */
import type { Proposal } from "./types";

/** Proposals awaiting the user's decision. */
export function pendingProposals(proposals: readonly Proposal[]): Proposal[] {
  return proposals.filter((p) => p.state === "pending_approval");
}

/** Proposals currently executing. */
export function activeProposals(proposals: readonly Proposal[]): Proposal[] {
  return proposals.filter((p) => p.state === "approved" || p.state === "executing");
}

/** Finished proposals (any terminal state). */
export function completedProposals(proposals: readonly Proposal[]): Proposal[] {
  return proposals.filter((p) =>
    ["completed", "rejected", "failed", "rolled_back"].includes(p.state),
  );
}

/** Trusted-policy proposals. */
export function trustedProposals(proposals: readonly Proposal[]): Proposal[] {
  return proposals.filter((p) => p.policy === "trusted");
}

/** The proposals the Chief should surface as executable recommendations (pending, low-friction first). */
export function chiefProposals(proposals: readonly Proposal[], limit = 5): Proposal[] {
  return pendingProposals(proposals)
    .slice()
    .sort((a, b) => riskRank(a.risk) - riskRank(b.risk))
    .slice(0, limit);
}

function riskRank(risk: Proposal["risk"]): number {
  return { low: 0, medium: 1, high: 2 }[risk];
}

/** Count summary for a badge / status bar. */
export function proposalCounts(proposals: readonly Proposal[]): {
  pending: number;
  active: number;
  completed: number;
  trusted: number;
} {
  return {
    pending: pendingProposals(proposals).length,
    active: activeProposals(proposals).length,
    completed: completedProposals(proposals).length,
    trusted: trustedProposals(proposals).length,
  };
}
