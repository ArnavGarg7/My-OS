import { evaluateConditions } from "./conditions";
import { orderedActions } from "./actions";
import { triggerMatches } from "./triggers";
import { scheduleRule } from "./scheduler";
import type {
  Action,
  AutomationContext,
  AutomationRule,
  ExecutionRecord,
  TriggerEvent,
} from "./types";

/**
 * Execution planner (Sprint 3.4). PURE — decides WHETHER a rule should execute for a
 * trigger (matches → conditions pass → scheduler allows) and returns the ordered
 * actions to run. It never performs the actions; the SERVER executor dispatches each
 * to an existing service. This keeps all business logic in the feature modules.
 */
export interface ExecutionPlan {
  shouldExecute: boolean;
  triggerMatched: boolean;
  conditionsPassed: boolean;
  scheduleDecision: string;
  runAt: string | null;
  actions: Action[];
  reason: string;
}

export interface PlanInput {
  rule: AutomationRule;
  event: TriggerEvent;
  context: AutomationContext;
  history: ExecutionRecord[];
}

export function planExecution(input: PlanInput): ExecutionPlan {
  const { rule, event, context, history } = input;

  if (rule.status !== "enabled") {
    return blocked("Rule is not enabled.", { triggerMatched: false });
  }

  const triggerMatched = triggerMatches(rule, event);
  if (!triggerMatched) {
    return blocked("Trigger does not match.", { triggerMatched: false });
  }

  const conditionsPassed = evaluateConditions(rule.conditions, event, context);
  if (!conditionsPassed) {
    return blocked("Conditions did not pass.", { triggerMatched: true });
  }

  const schedule = scheduleRule(rule, {
    now: context.now,
    timezone: context.timezone,
    history,
  });

  if (schedule.decision !== "run") {
    return {
      shouldExecute: false,
      triggerMatched: true,
      conditionsPassed: true,
      scheduleDecision: schedule.decision,
      runAt: schedule.runAt,
      actions: [],
      reason: schedule.reason,
    };
  }

  return {
    shouldExecute: true,
    triggerMatched: true,
    conditionsPassed: true,
    scheduleDecision: "run",
    runAt: schedule.runAt,
    actions: orderedActions(rule.actions),
    reason: "Trigger matched, conditions passed, schedule allows.",
  };
}

function blocked(
  reason: string,
  flags: { triggerMatched: boolean; conditionsPassed?: boolean },
): ExecutionPlan {
  return {
    shouldExecute: false,
    triggerMatched: flags.triggerMatched,
    conditionsPassed: flags.conditionsPassed ?? false,
    scheduleDecision: "skip",
    runAt: null,
    actions: [],
    reason,
  };
}
