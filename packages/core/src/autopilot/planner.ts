/**
 * Automation Planner + Proposal Generator (Sprint 6.3, spec §Automation Planner / §Proposal
 * Generator). Deterministically turns triggering Signals / Prediction Signals into eligible
 * automations → reviewable Proposals (explanation + expected benefit + risk + rollback summary +
 * execution plan). Pure — no IO, no AI. Nothing executes; this only proposes.
 */
import type { Signal } from "../events/types";
import type { Automation, Policy, Proposal, RiskLevel } from "./types";
import { automationsForTrigger } from "./registry";
import { evaluateConditions, type FactMap } from "./conditions";
import { buildExecutionPlan, isFullyReversible } from "./execution-plan";
import { initialState } from "./approval";

export interface PlannerDeps {
  newId: () => string;
  now: Date;
  /** Resolve the effective policy for an automation (user overrides applied server-side). */
  policyFor?: (automationId: string) => Policy;
}

/** Turn a triggering signal into the fact map the conditions read. */
export function factsFromSignal(signal: Signal, now: Date): FactMap {
  const expired = !!signal.expiresAt && new Date(signal.expiresAt).getTime() <= now.getTime();
  return {
    "signal.category": signal.category,
    "signal.severity": signal.severity,
    "signal.status": signal.status,
    "signal.expired": expired,
    "signal.stale": expired && signal.category === "opportunities",
    "signal.confidence": signal.confidence,
  };
}

const RISK_BENEFIT: Record<RiskLevel, string> = {
  low: "keeps your workspace tidy",
  medium: "recovers time or focus",
  high: "significant change",
};

/** Build a proposal from an eligible automation + its triggering source. */
export function buildProposal(
  automation: Automation,
  source: { kind: "signal" | "prediction" | "manual"; id: string } | null,
  reason: string,
  deps: PlannerDeps,
): Proposal {
  const plan = buildExecutionPlan(automation, deps);
  const policy = deps.policyFor?.(automation.id) ?? automation.defaultPolicy;
  const rollbackSummary = automation.reversible
    ? plan.steps
        .filter((s) => s.rollback)
        .map((s) => s.rollback!.label)
        .join("; ") || "reversible"
    : "not reversible";
  return {
    id: deps.newId(),
    automationId: automation.id,
    title: automation.name,
    reason,
    expectedBenefit: RISK_BENEFIT[automation.risk],
    risk: automation.risk,
    rollbackSummary,
    plan,
    policy,
    state: initialState(policy),
    source,
    createdAt: deps.now.toISOString(),
  };
}

/**
 * Plan proposals from a batch of signals: for each signal, every trigger-matching automation whose
 * conditions hold AND whose plan is fully reversible AND whose policy isn't `disabled` yields one
 * proposal. Deterministic; deduped by (automationId, source id).
 */
export function planFromSignals(signals: readonly Signal[], deps: PlannerDeps): Proposal[] {
  const out: Proposal[] = [];
  const seen = new Set<string>();
  for (const signal of signals) {
    const facts = factsFromSignal(signal, deps.now);
    for (const automation of automationsForTrigger("signal_created")) {
      const policy = deps.policyFor?.(automation.id) ?? automation.defaultPolicy;
      if (policy === "disabled") continue;
      if (!evaluateConditions(automation.conditions, facts)) continue;
      const key = `${automation.id}:${signal.id}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const plan = buildExecutionPlan(automation, deps);
      if (!isFullyReversible(plan)) continue; // never propose an irreversible mutating plan
      out.push(
        buildProposal(
          automation,
          { kind: "signal", id: signal.id },
          `${signal.explanation.headline} — ${automation.description}`,
          deps,
        ),
      );
    }
  }
  return out;
}
