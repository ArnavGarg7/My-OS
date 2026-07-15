import { describe, expect, it } from "vitest";
import { automationDraftSchema, conditionGroupSchema, policyConfigSchema } from "../schemas";
import {
  ACTION_KINDS,
  CONDITION_OPERATORS,
  EXECUTION_POLICIES,
  TIME_CONDITIONS,
  TRIGGER_KINDS,
} from "../constants";
import { evaluateLeaf, evaluateTimeCondition } from "../conditions";
import { scheduleRule } from "../scheduler";
import { defaultMaxExecutionsPolicy } from "../engine";
import { summarizeAction, makeAction } from "../actions";
import { makeContext, makeEvent, makeRule, makeRecord } from "../fixtures";
import type { Condition } from "../types";

function leaf(over: Partial<Condition>): Condition {
  return { id: "c1", field: "value", operator: "equals", value: 1, ...over };
}

describe("schema validation", () => {
  it("accepts a full valid draft", () => {
    const r = automationDraftSchema.safeParse({
      name: "Rule",
      trigger: { kind: "task", event: "task.created" },
      actions: [{ id: "a1", kind: "noop", params: {}, order: 0 }],
      policy: { policy: "cooldown", cooldownMinutes: 30 },
    });
    expect(r.success).toBe(true);
  });

  it("rejects an empty action list", () => {
    const r = automationDraftSchema.safeParse({
      name: "Rule",
      trigger: { kind: "task", event: "task.created" },
      actions: [],
    });
    expect(r.success).toBe(false);
  });

  it("rejects a bad schedule time", () => {
    expect(policyConfigSchema.safeParse({ policy: "schedule", scheduleAt: "9am" }).success).toBe(
      false,
    );
    expect(policyConfigSchema.safeParse({ policy: "schedule", scheduleAt: "09:30" }).success).toBe(
      true,
    );
  });

  it("validates a nested condition group", () => {
    const r = conditionGroupSchema.safeParse({
      combinator: "and",
      conditions: [
        { id: "c1", field: "x", operator: "equals", value: 1 },
        {
          combinator: "or",
          conditions: [{ id: "c2", field: "y", operator: "greater_than", value: 3 }],
        },
      ],
    });
    expect(r.success).toBe(true);
  });
});

describe("every operator has a code path", () => {
  const event = makeEvent({ payload: { n: 5, s: "hello", arr: [1, 2] } });
  const ctx = makeContext();
  for (const op of CONDITION_OPERATORS) {
    it(`operator ${op} evaluates to a boolean`, () => {
      const value =
        op === "between" ? [0, 10] : op === "before" || op === "after" ? "2026-07-15T00:00:00Z" : 5;
      const result = evaluateLeaf(leaf({ field: "n", operator: op, value }), event, ctx);
      expect(typeof result).toBe("boolean");
    });
  }
});

describe("every time condition resolves", () => {
  for (const tc of TIME_CONDITIONS) {
    it(`time condition ${tc} resolves to a boolean`, () => {
      expect(typeof evaluateTimeCondition(tc, makeContext())).toBe("boolean");
    });
  }
});

describe("every action kind summarizes", () => {
  for (const kind of ACTION_KINDS) {
    it(`action ${kind} has a summary`, () => {
      expect(summarizeAction(makeAction("a", kind, 0)).length).toBeGreaterThan(0);
    });
  }
});

describe("every policy produces a decision", () => {
  const now = new Date("2026-07-15T12:00:00Z");
  for (const policy of EXECUTION_POLICIES) {
    it(`policy ${policy} yields a schedule decision`, () => {
      const rule = makeRule({ policy: { policy } });
      const d = scheduleRule(rule, { now, timezone: "UTC", history: [] });
      expect(["run", "delay", "skip", "cooldown", "retry"]).toContain(d.decision);
    });
  }
});

describe("trigger kinds are all distinct + usable", () => {
  it("has unique trigger kinds", () => {
    expect(new Set(TRIGGER_KINDS).size).toBe(TRIGGER_KINDS.length);
  });
  it("defaultMaxExecutionsPolicy shape", () => {
    const p = defaultMaxExecutionsPolicy();
    expect(p.policy).toBe("max_executions");
    expect(p.maxExecutions).toBeGreaterThan(0);
  });
});

describe("history-driven scheduling stability", () => {
  it("throttle after a very old run allows a run", () => {
    const rule = makeRule({ policy: { policy: "throttle", throttleMinutes: 5 } });
    const old = makeRecord({ ruleId: rule.id, triggeredAt: "2026-07-15T09:00:00Z" });
    const d = scheduleRule(rule, {
      now: new Date("2026-07-15T12:00:00Z"),
      timezone: "UTC",
      history: [old],
    });
    expect(d.decision).toBe("run");
  });
});
