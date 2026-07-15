import { describe, expect, it } from "vitest";
import { planExecution } from "../executor";
import { makeContext, makeEvent, makeRule, makeRecord } from "../fixtures";
import type { ConditionGroup } from "../types";

const context = makeContext();

describe("planExecution", () => {
  it("executes when enabled, matched, conditions pass, schedule allows", () => {
    const plan = planExecution({
      rule: makeRule(),
      event: makeEvent(),
      context,
      history: [],
    });
    expect(plan.shouldExecute).toBe(true);
    expect(plan.actions).toHaveLength(1);
  });

  it("blocks a disabled rule", () => {
    const plan = planExecution({
      rule: makeRule({ status: "disabled" }),
      event: makeEvent(),
      context,
      history: [],
    });
    expect(plan.shouldExecute).toBe(false);
    expect(plan.reason).toContain("not enabled");
  });

  it("blocks when the trigger does not match", () => {
    const plan = planExecution({
      rule: makeRule({ trigger: { kind: "focus", event: "focus.completed" } }),
      event: makeEvent({ kind: "planner", event: "planner.generated" }),
      context,
      history: [],
    });
    expect(plan.triggerMatched).toBe(false);
    expect(plan.shouldExecute).toBe(false);
  });

  it("blocks when conditions fail", () => {
    const conditions: ConditionGroup = {
      combinator: "and",
      conditions: [{ id: "c1", field: "count", operator: "greater_than", value: 100 }],
    };
    const plan = planExecution({
      rule: makeRule({ conditions }),
      event: makeEvent({ payload: { count: 1 } }),
      context,
      history: [],
    });
    expect(plan.conditionsPassed).toBe(false);
    expect(plan.shouldExecute).toBe(false);
  });

  it("blocks when the scheduler denies (cooldown)", () => {
    const rule = makeRule({ policy: { policy: "cooldown", cooldownMinutes: 60 } });
    const recent = makeRecord({
      ruleId: rule.id,
      outcome: "completed",
      triggeredAt: context.now.toISOString(),
    });
    const plan = planExecution({ rule, event: makeEvent(), context, history: [recent] });
    expect(plan.shouldExecute).toBe(false);
    expect(plan.scheduleDecision).toBe("cooldown");
  });

  it("orders actions by their order field", () => {
    const rule = makeRule({
      actions: [
        { id: "a2", kind: "noop", params: {}, order: 2 },
        { id: "a1", kind: "log_timeline_event", params: {}, order: 1 },
      ],
    });
    const plan = planExecution({ rule, event: makeEvent(), context, history: [] });
    expect(plan.actions.map((a) => a.id)).toEqual(["a1", "a2"]);
  });
});
