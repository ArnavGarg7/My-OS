import { DEFAULT_EXPIRY_MINUTES } from "./constants";
import { DECISION_RULES, type DecisionRule } from "./rules";
import { scoreDecision } from "./score";
import { cooldownUntil, isDue, isInCooldown } from "./scheduler";
import { rankDecisions } from "./selectors";
import type { BuiltDecision, Decision, DecisionContext } from "./types";

/**
 * DecisionEngine (Sprint 2.3). Deterministic generation, ranking and lifecycle
 * transitions. Pure — it takes context + the day's existing decisions and
 * returns the reconciled set (dedup by rule, replacement, cooldown, expiry). The
 * server persists the results; the engine never touches IO.
 */
function expiryFrom(built: BuiltDecision, ctx: DecisionContext): string | null {
  const mins = built.expiresInMinutes ?? DEFAULT_EXPIRY_MINUTES;
  if (mins == null) return null;
  return new Date(ctx.now.getTime() + mins * 60000).toISOString();
}

export class DecisionEngine {
  constructor(private readonly rules: DecisionRule[] = DECISION_RULES) {}

  /** Reconcile fired rules with existing decisions into the current set. */
  generate(ctx: DecisionContext, existing: Decision[] = []): Decision[] {
    const byRule = new Map(existing.map((d) => [d.ruleId, d]));
    const fired = new Set<string>();
    const result: Decision[] = [];

    for (const rule of this.rules) {
      if (!rule.matches(ctx)) continue;
      fired.add(rule.id);
      result.push(this.materialize(rule, byRule.get(rule.id), ctx));
    }

    // Carry forward existing decisions whose rule didn't fire this round.
    for (const d of existing) {
      if (fired.has(d.ruleId)) continue;
      if (d.state === "accepted" || d.state === "completed") result.push(d);
      else if (d.state === "deferred" && !isDue(d.deferredUntil, ctx.now)) result.push(d);
      else if (d.state === "dismissed" && isInCooldown(d, ctx.now)) result.push(d);
      else if (d.state === "pending") result.push({ ...d, state: "expired" });
      // dismissed-past-cooldown / deferred-due / already-expired → dropped
    }

    return result.map((d) =>
      d.state === "pending" ? { ...d, score: scoreDecision(d, ctx).score } : d,
    );
  }

  private materialize(
    rule: DecisionRule,
    prev: Decision | undefined,
    ctx: DecisionContext,
  ): Decision {
    const built = rule.build(ctx);
    if (prev) {
      if (prev.state === "accepted" || prev.state === "completed") return prev;
      if (prev.state === "dismissed" && isInCooldown(prev, ctx.now)) return prev;
      if (prev.state === "deferred" && !isDue(prev.deferredUntil, ctx.now)) return prev;
      // Resurface / replace with fresh content — no duplicate row.
      return {
        ...prev,
        state: "pending",
        type: rule.type,
        priority: rule.priority,
        title: built.title,
        reason: built.reason,
        confidence: built.confidence,
        inputsUsed: built.inputsUsed,
        deferredUntil: null,
        expiresAt: expiryFrom(built, ctx),
      };
    }
    return this.create(rule, built, ctx);
  }

  private create(rule: DecisionRule, built: BuiltDecision, ctx: DecisionContext): Decision {
    return {
      id: "",
      ruleId: rule.id,
      type: rule.type,
      title: built.title,
      reason: built.reason,
      confidence: built.confidence,
      priority: rule.priority,
      score: 0,
      state: "pending",
      inputsUsed: built.inputsUsed,
      expiresAt: expiryFrom(built, ctx),
      deferredUntil: null,
      completedAt: null,
      createdAt: ctx.now.toISOString(),
      metadata: {},
    };
  }

  rank(decisions: Decision[]): Decision[] {
    return rankDecisions(decisions);
  }

  accept(decision: Decision, at: Date): Decision {
    return {
      ...decision,
      state: "accepted",
      metadata: { ...decision.metadata, acceptedAt: at.toISOString() },
    };
  }

  dismiss(decision: Decision, at: Date): Decision {
    return {
      ...decision,
      state: "dismissed",
      metadata: {
        ...decision.metadata,
        dismissedAt: at.toISOString(),
        cooldownUntil: cooldownUntil(at).toISOString(),
      },
    };
  }

  defer(decision: Decision, until: Date): Decision {
    return { ...decision, state: "deferred", deferredUntil: until.toISOString() };
  }

  complete(decision: Decision, at: Date): Decision {
    return { ...decision, state: "completed", completedAt: at.toISOString() };
  }

  expire(decision: Decision): Decision {
    return { ...decision, state: "expired" };
  }

  replace(
    prev: Decision,
    incoming: Pick<
      Decision,
      "title" | "reason" | "confidence" | "type" | "priority" | "inputsUsed"
    >,
  ): Decision {
    return { ...prev, ...incoming, state: "pending" };
  }
}

export const decisionEngine = new DecisionEngine();
