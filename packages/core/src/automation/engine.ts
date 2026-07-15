import { DEFAULT_MAX_EXECUTIONS, type AutomationPriority } from "./constants";
import { emptyConditions, evaluateConditions } from "./conditions";
import { summarizeAction, orderedActions } from "./actions";
import { planExecution, type ExecutionPlan } from "./executor";
import { orderByPriority } from "./priority";
import { rulesForEvent, triggerMatches } from "./triggers";
import { validateAutomation } from "./validation";
import type {
  Action,
  AutomationContext,
  AutomationDraft,
  AutomationPreview,
  AutomationRule,
  ExecutionRecord,
  TriggerEvent,
} from "./types";

/**
 * AutomationEngine (Sprint 3.4). A pure orchestrator over the automation primitives.
 * Ids + clock are injected (no IO). It creates/edits rules, plans executions for an
 * incoming trigger (matched rules ordered by priority, conditions + scheduler applied)
 * and previews a rule without executing. It holds NO feature logic — the server
 * executor dispatches the planned actions to existing services.
 */
export interface AutomationEngineDeps {
  newId: () => string;
  now: () => Date;
}

export class AutomationEngine {
  constructor(private readonly deps: AutomationEngineDeps) {}

  private clock(): Date {
    return this.deps.now();
  }

  createRule(draft: AutomationDraft): AutomationRule {
    const now = this.clock();
    const nowIso = now.toISOString();
    return {
      id: this.deps.newId(),
      name: draft.name.trim(),
      description: draft.description ?? "",
      status: "created",
      priority: (draft.priority ?? "medium") as AutomationPriority,
      trigger: draft.trigger,
      conditions: draft.conditions ?? emptyConditions(),
      actions: orderedActions(draft.actions),
      policy: draft.policy ?? { policy: "run_always" },
      builtIn: draft.builtIn ?? false,
      createdAt: nowIso,
      updatedAt: nowIso,
    };
  }

  private touch(rule: AutomationRule): AutomationRule {
    return { ...rule, updatedAt: this.clock().toISOString() };
  }

  enable(rule: AutomationRule): AutomationRule {
    return this.touch({ ...rule, status: "enabled" });
  }

  disable(rule: AutomationRule): AutomationRule {
    return this.touch({ ...rule, status: "disabled" });
  }

  archive(rule: AutomationRule): AutomationRule {
    return this.touch({ ...rule, status: "archived" });
  }

  update(rule: AutomationRule, patch: Partial<AutomationDraft>): AutomationRule {
    return this.touch({
      ...rule,
      ...(patch.name !== undefined ? { name: patch.name.trim() } : {}),
      ...(patch.description !== undefined ? { description: patch.description } : {}),
      ...(patch.priority !== undefined ? { priority: patch.priority } : {}),
      ...(patch.trigger !== undefined ? { trigger: patch.trigger } : {}),
      ...(patch.conditions !== undefined ? { conditions: patch.conditions } : {}),
      ...(patch.actions !== undefined ? { actions: orderedActions(patch.actions) } : {}),
      ...(patch.policy !== undefined ? { policy: patch.policy } : {}),
    });
  }

  validate(draft: AutomationDraft | AutomationRule, existing: AutomationRule[] = []) {
    return validateAutomation(draft, existing);
  }

  /** All enabled rules whose trigger matches `event`, ordered by priority, with plans. */
  planForEvent(
    rules: AutomationRule[],
    event: TriggerEvent,
    context: AutomationContext,
    history: ExecutionRecord[],
  ): { rule: AutomationRule; plan: ExecutionPlan }[] {
    const matched = orderByPriority(rulesForEvent(rules, event));
    return matched.map((rule) => ({
      rule,
      plan: planExecution({ rule, event, context, history }),
    }));
  }

  /** Pure preview — what a rule WOULD do for a trigger, without executing anything. */
  preview(
    rule: AutomationRule,
    event: TriggerEvent,
    context: AutomationContext,
  ): AutomationPreview {
    const triggerMatched = triggerMatches(rule, event);
    const conditionsPass = triggerMatched && evaluateConditions(rule.conditions, event, context);
    const wouldExecute = rule.status === "enabled" && triggerMatched && conditionsPass;
    const actions = orderedActions(rule.actions).map((a: Action) => ({
      kind: a.kind,
      summary: summarizeAction(a),
    }));
    return {
      triggerMatches: triggerMatched,
      conditionsPass,
      wouldExecute,
      actions,
      expectedResult: wouldExecute
        ? actions.map((a) => a.summary).join("; ")
        : "No actions would run.",
      reason: !triggerMatched
        ? "Trigger does not match."
        : !conditionsPass
          ? "Conditions would not pass."
          : rule.status !== "enabled"
            ? "Rule is not enabled."
            : "Would execute.",
    };
  }
}

export function createAutomationEngine(
  newId: () => string,
  now: () => Date = () => new Date(),
): AutomationEngine {
  return new AutomationEngine({ newId, now });
}

/** A safe default max-executions policy config. */
export function defaultMaxExecutionsPolicy() {
  return { policy: "max_executions" as const, maxExecutions: DEFAULT_MAX_EXECUTIONS };
}
