import type { TimeCondition } from "./constants";
import { minutesOfDayInTz, isMinuteWithin, parseHHMM } from "../notification/quiet-hours";
import type { AutomationContext, Condition, ConditionGroup, TriggerEvent } from "./types";

/**
 * Condition engine (Sprint 3.4). Deterministic evaluation of composable conditions
 * against a trigger event + execution context. Operators (equals/gt/contains/between/
 * before/after/…) + AND/OR/NOT groups + named time windows (reusing existing engines).
 * Pure — no side effects.
 */
function resolveField(field: string, event: TriggerEvent, ctx: AutomationContext): unknown {
  // Special context fields.
  if (field === "now") return ctx.now.toISOString();
  if (field === "timezone") return ctx.timezone;
  if (field === "focusSessionActive") return ctx.focusSessionActive;
  if (field === "plannerGenerated") return ctx.plannerGenerated;
  // Dot-path into the trigger payload (then metadata).
  const fromPayload = getPath(event.payload, field);
  if (fromPayload !== undefined) return fromPayload;
  return getPath(event.metadata, field);
}

function getPath(obj: Record<string, unknown>, path: string): unknown {
  return path.split(".").reduce<unknown>((acc, key) => {
    if (acc && typeof acc === "object" && key in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
}

function num(v: unknown): number | null {
  const n = typeof v === "number" ? v : Number.parseFloat(String(v));
  return Number.isNaN(n) ? null : n;
}

function time(v: unknown): number | null {
  const t = Date.parse(String(v));
  return Number.isNaN(t) ? null : t;
}

export function evaluateLeaf(
  condition: Condition,
  event: TriggerEvent,
  ctx: AutomationContext,
): boolean {
  if (condition.timeCondition) return evaluateTimeCondition(condition.timeCondition, ctx);

  const actual = resolveField(condition.field, event, ctx);
  const expected = condition.value;

  switch (condition.operator) {
    case "equals":
      return actual === expected;
    case "not_equals":
      return actual !== expected;
    case "greater_than": {
      const a = num(actual);
      const b = num(expected);
      return a !== null && b !== null && a > b;
    }
    case "less_than": {
      const a = num(actual);
      const b = num(expected);
      return a !== null && b !== null && a < b;
    }
    case "contains":
      if (Array.isArray(actual)) return actual.includes(expected);
      return typeof actual === "string" && actual.includes(String(expected));
    case "exists":
      return actual !== undefined && actual !== null;
    case "missing":
      return actual === undefined || actual === null;
    case "between": {
      const a = num(actual);
      const range = Array.isArray(expected) ? expected : [];
      const min = num(range[0]);
      const max = num(range[1]);
      return a !== null && min !== null && max !== null && a >= min && a <= max;
    }
    case "before": {
      const a = time(actual);
      const b = time(expected);
      return a !== null && b !== null && a < b;
    }
    case "after": {
      const a = time(actual);
      const b = time(expected);
      return a !== null && b !== null && a > b;
    }
    default:
      return false;
  }
}

/** Named time windows — reuse existing engine state; never recompute business logic. */
export function evaluateTimeCondition(tc: TimeCondition, ctx: AutomationContext): boolean {
  const mins = minutesOfDayInTz(ctx.now, ctx.timezone);
  const day = new Intl.DateTimeFormat("en-US", {
    timeZone: ctx.timezone,
    weekday: "short",
  }).format(ctx.now);
  const isWeekend = day === "Sat" || day === "Sun";

  switch (tc) {
    case "working_hours":
      return isMinuteWithin(
        mins,
        parseHHMM(ctx.workingHours.start),
        parseHHMM(ctx.workingHours.end),
      );
    case "weekend":
      return isWeekend;
    case "weekday":
      return !isWeekend;
    case "morning":
      return mins >= 300 && mins < 720; // 05:00–12:00
    case "afternoon":
      return mins >= 720 && mins < 1020; // 12:00–17:00
    case "evening":
      return mins >= 1020 && mins < 1260; // 17:00–21:00
    case "night":
      return mins >= 1260 || mins < 300; // 21:00–05:00
    case "quiet_hours":
      return (
        ctx.quietHours.enabled &&
        isMinuteWithin(mins, parseHHMM(ctx.quietHours.start), parseHHMM(ctx.quietHours.end))
      );
    case "focus_session_active":
      return ctx.focusSessionActive;
    case "planner_generated":
      return ctx.plannerGenerated;
    default:
      return false;
  }
}

function isGroup(node: Condition | ConditionGroup): node is ConditionGroup {
  return (node as ConditionGroup).combinator !== undefined;
}

/** Recursively evaluate a condition group. An empty group passes (no constraints). */
export function evaluateConditions(
  group: ConditionGroup,
  event: TriggerEvent,
  ctx: AutomationContext,
): boolean {
  const results = group.conditions.map((node) =>
    isGroup(node) ? evaluateConditions(node, event, ctx) : evaluateLeaf(node, event, ctx),
  );
  switch (group.combinator) {
    case "and":
      return results.every(Boolean);
    case "or":
      return results.length === 0 ? true : results.some(Boolean);
    case "not":
      return !results.some(Boolean);
    default:
      return true;
  }
}

/** An empty AND group — matches everything (used as a default). */
export function emptyConditions(): ConditionGroup {
  return { combinator: "and", conditions: [] };
}
