/**
 * Condition Engine (Sprint 6.3, spec §Condition Engine). Deterministically evaluates an automation's
 * conditions (ALL must hold) against a flat fact map. Pure — no side effects. No execution happens
 * until every condition succeeds.
 */
import type { AutomationCondition } from "./types";

/** A flat map of named facts drawn from the triggering signal/prediction + context. */
export type FactMap = Record<string, unknown>;

/** Evaluate one condition against the facts. */
export function evaluateCondition(cond: AutomationCondition, facts: FactMap): boolean {
  const actual = facts[cond.fact];
  switch (cond.op) {
    case "eq":
      return actual === cond.value;
    case "neq":
      return actual !== cond.value;
    case "gte":
      return typeof actual === "number" && typeof cond.value === "number" && actual >= cond.value;
    case "lte":
      return typeof actual === "number" && typeof cond.value === "number" && actual <= cond.value;
    case "exists":
      return actual !== undefined && actual !== null;
    case "in":
      return Array.isArray(cond.value) && cond.value.includes(actual);
    default:
      return false;
  }
}

/** True iff every condition holds (empty ⇒ eligible). */
export function evaluateConditions(
  conditions: readonly AutomationCondition[],
  facts: FactMap,
): boolean {
  return conditions.every((c) => evaluateCondition(c, facts));
}

/** Which conditions failed (for explanation). */
export function failedConditions(
  conditions: readonly AutomationCondition[],
  facts: FactMap,
): AutomationCondition[] {
  return conditions.filter((c) => !evaluateCondition(c, facts));
}
