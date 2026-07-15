import type { TriggerKind } from "./constants";
import type { AutomationRule, TriggerEvent } from "./types";

/**
 * Trigger engine (Sprint 3.4). Pure helpers to build a normalized TriggerEvent from a
 * module signal and to match events against a rule's trigger. Automation reuses the
 * existing signal models — a trigger is just a typed event, never new feature logic.
 */
export function makeTrigger(
  id: string,
  kind: TriggerKind,
  event: string,
  now: Date,
  payload: Record<string, unknown> = {},
  metadata: Record<string, unknown> = {},
): TriggerEvent {
  return {
    id,
    kind,
    event,
    source: kind,
    timestamp: now.toISOString(),
    payload,
    metadata,
  };
}

/** Whether a trigger event matches a rule's trigger (kind + event name). */
export function triggerMatches(rule: AutomationRule, event: TriggerEvent): boolean {
  if (rule.trigger.kind !== event.kind) return false;
  // An empty/"*" event on the rule matches any event of that kind.
  if (rule.trigger.event === "" || rule.trigger.event === "*") return true;
  return rule.trigger.event === event.event;
}

/** All enabled rules whose trigger matches an event. */
export function rulesForEvent(rules: AutomationRule[], event: TriggerEvent): AutomationRule[] {
  return rules.filter((r) => r.status === "enabled" && triggerMatches(r, event));
}
