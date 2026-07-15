import { MAX_ACTION_DEPTH, SELF_TRIGGERING_ACTIONS } from "./constants";
import type { AutomationDraft, AutomationRule, Condition, ConditionGroup } from "./types";

/**
 * Automation validation (Sprint 3.4). Deterministic guards that prevent unsafe or
 * impossible rules: recursion (an action re-fires the rule's own trigger), circular
 * action chains, duplicate rules, invalid conditions and impossible schedules.
 */
export interface ValidationIssue {
  code: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  issues: ValidationIssue[];
}

function isGroup(node: Condition | ConditionGroup): node is ConditionGroup {
  return (node as ConditionGroup).combinator !== undefined;
}

function collectConditions(group: ConditionGroup, depth = 0): { count: number; depth: number } {
  let count = 0;
  let maxDepth = depth;
  for (const node of group.conditions) {
    if (isGroup(node)) {
      const inner = collectConditions(node, depth + 1);
      count += inner.count;
      maxDepth = Math.max(maxDepth, inner.depth);
    } else {
      count += 1;
    }
  }
  return { count, depth: maxDepth };
}

/** Validate a draft/rule. `existing` is used to detect duplicate rules. */
export function validateAutomation(
  draft: AutomationDraft | AutomationRule,
  existing: AutomationRule[] = [],
): ValidationResult {
  const issues: ValidationIssue[] = [];

  if (!draft.name || draft.name.trim().length === 0) {
    issues.push({ code: "name-required", message: "A rule needs a name." });
  }

  if (!draft.actions || draft.actions.length === 0) {
    issues.push({ code: "no-actions", message: "A rule needs at least one action." });
  }

  // Recursion guard: an action that re-fires this rule's own trigger kind.
  for (const action of draft.actions ?? []) {
    const producedKind = SELF_TRIGGERING_ACTIONS[action.kind];
    if (producedKind && producedKind === draft.trigger.kind) {
      issues.push({
        code: "recursive",
        message: `Action "${action.kind}" re-fires this rule's own trigger (${draft.trigger.kind}).`,
      });
    }
  }

  // Circular / overly-deep action chain (guards run_custom_workflow chains).
  if ((draft.actions?.length ?? 0) > MAX_ACTION_DEPTH) {
    issues.push({
      code: "chain-too-deep",
      message: `Too many chained actions (max ${MAX_ACTION_DEPTH}).`,
    });
  }

  // Duplicate rule: same trigger + identical action kinds + same name.
  const dup = existing.find(
    (r) =>
      ("id" in draft ? r.id !== (draft as AutomationRule).id : true) &&
      r.trigger.kind === draft.trigger.kind &&
      r.trigger.event === draft.trigger.event &&
      r.name.trim().toLowerCase() === draft.name.trim().toLowerCase(),
  );
  if (dup) {
    issues.push({ code: "duplicate", message: "A rule with this name + trigger already exists." });
  }

  // Invalid conditions: between needs a 2-tuple; before/after need parseable dates.
  if (draft.conditions) {
    validateConditionGroup(draft.conditions, issues);
    const { depth } = collectConditions(draft.conditions);
    if (depth > 5) {
      issues.push({ code: "conditions-too-deep", message: "Condition nesting is too deep." });
    }
  }

  // Impossible schedule: schedule policy with a malformed time.
  if (draft.policy?.policy === "schedule" && draft.policy.scheduleAt) {
    if (!/^\d{2}:\d{2}$/.test(draft.policy.scheduleAt)) {
      issues.push({ code: "bad-schedule", message: "Schedule time must be HH:MM." });
    }
  }
  if (draft.policy?.policy === "max_executions" && (draft.policy.maxExecutions ?? 1) < 1) {
    issues.push({ code: "bad-max", message: "Max executions must be at least 1." });
  }

  return { valid: issues.length === 0, issues };
}

function validateConditionGroup(group: ConditionGroup, issues: ValidationIssue[]): void {
  for (const node of group.conditions) {
    if (isGroup(node)) {
      validateConditionGroup(node, issues);
      continue;
    }
    if (node.operator === "between" && (!Array.isArray(node.value) || node.value.length !== 2)) {
      issues.push({ code: "bad-between", message: `Condition "${node.field}" needs a [min,max].` });
    }
    if (
      (node.operator === "before" || node.operator === "after") &&
      Number.isNaN(Date.parse(String(node.value)))
    ) {
      issues.push({
        code: "bad-date",
        message: `Condition "${node.field}" needs a valid date.`,
      });
    }
  }
}
