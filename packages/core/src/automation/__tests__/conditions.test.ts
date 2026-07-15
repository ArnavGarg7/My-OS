import { describe, expect, it } from "vitest";
import {
  emptyConditions,
  evaluateConditions,
  evaluateLeaf,
  evaluateTimeCondition,
} from "../conditions";
import { makeContext, makeEvent } from "../fixtures";
import type { Condition, ConditionGroup } from "../types";

const ctx = makeContext();

function leaf(over: Partial<Condition>): Condition {
  return { id: "c1", field: "value", operator: "equals", value: 1, ...over };
}

describe("condition operators", () => {
  const event = makeEvent({ payload: { count: 5, name: "hello", tags: ["a", "b"] } });

  it("equals / not_equals", () => {
    expect(evaluateLeaf(leaf({ field: "count", operator: "equals", value: 5 }), event, ctx)).toBe(
      true,
    );
    expect(
      evaluateLeaf(leaf({ field: "count", operator: "not_equals", value: 5 }), event, ctx),
    ).toBe(false);
  });

  it("greater_than / less_than", () => {
    expect(
      evaluateLeaf(leaf({ field: "count", operator: "greater_than", value: 3 }), event, ctx),
    ).toBe(true);
    expect(
      evaluateLeaf(leaf({ field: "count", operator: "less_than", value: 3 }), event, ctx),
    ).toBe(false);
  });

  it("contains on strings and arrays", () => {
    expect(
      evaluateLeaf(leaf({ field: "name", operator: "contains", value: "ell" }), event, ctx),
    ).toBe(true);
    expect(
      evaluateLeaf(leaf({ field: "tags", operator: "contains", value: "a" }), event, ctx),
    ).toBe(true);
    expect(
      evaluateLeaf(leaf({ field: "tags", operator: "contains", value: "z" }), event, ctx),
    ).toBe(false);
  });

  it("exists / missing", () => {
    expect(
      evaluateLeaf(leaf({ field: "count", operator: "exists", value: null }), event, ctx),
    ).toBe(true);
    expect(
      evaluateLeaf(leaf({ field: "nope", operator: "missing", value: null }), event, ctx),
    ).toBe(true);
  });

  it("between", () => {
    expect(
      evaluateLeaf(leaf({ field: "count", operator: "between", value: [1, 10] }), event, ctx),
    ).toBe(true);
    expect(
      evaluateLeaf(leaf({ field: "count", operator: "between", value: [6, 10] }), event, ctx),
    ).toBe(false);
  });

  it("before / after dates", () => {
    const e = makeEvent({ payload: { at: "2026-07-15T10:00:00Z" } });
    expect(
      evaluateLeaf(
        leaf({ field: "at", operator: "before", value: "2026-07-16T00:00:00Z" }),
        e,
        ctx,
      ),
    ).toBe(true);
    expect(
      evaluateLeaf(leaf({ field: "at", operator: "after", value: "2026-07-14T00:00:00Z" }), e, ctx),
    ).toBe(true);
  });
});

describe("condition groups", () => {
  const event = makeEvent({ payload: { count: 5, active: true } });

  it("AND requires all", () => {
    const group: ConditionGroup = {
      combinator: "and",
      conditions: [
        leaf({ field: "count", operator: "greater_than", value: 3 }),
        leaf({ field: "active", operator: "equals", value: true }),
      ],
    };
    expect(evaluateConditions(group, event, ctx)).toBe(true);
  });

  it("OR requires any", () => {
    const group: ConditionGroup = {
      combinator: "or",
      conditions: [
        leaf({ field: "count", operator: "greater_than", value: 100 }),
        leaf({ field: "active", operator: "equals", value: true }),
      ],
    };
    expect(evaluateConditions(group, event, ctx)).toBe(true);
  });

  it("NOT negates", () => {
    const group: ConditionGroup = {
      combinator: "not",
      conditions: [leaf({ field: "active", operator: "equals", value: false })],
    };
    expect(evaluateConditions(group, event, ctx)).toBe(true);
  });

  it("empty group passes", () => {
    expect(evaluateConditions(emptyConditions(), event, ctx)).toBe(true);
  });

  it("nested groups compose", () => {
    const group: ConditionGroup = {
      combinator: "and",
      conditions: [
        leaf({ field: "count", operator: "greater_than", value: 3 }),
        {
          combinator: "or",
          conditions: [
            leaf({ field: "active", operator: "equals", value: false }),
            leaf({ field: "count", operator: "equals", value: 5 }),
          ],
        },
      ],
    };
    expect(evaluateConditions(group, event, ctx)).toBe(true);
  });
});

describe("time conditions", () => {
  it("working hours", () => {
    expect(
      evaluateTimeCondition(
        "working_hours",
        makeContext({ now: new Date("2026-07-15T10:00:00Z") }),
      ),
    ).toBe(true);
    expect(
      evaluateTimeCondition(
        "working_hours",
        makeContext({ now: new Date("2026-07-15T20:00:00Z") }),
      ),
    ).toBe(false);
  });
  it("weekend / weekday", () => {
    expect(
      evaluateTimeCondition("weekend", makeContext({ now: new Date("2026-07-18T10:00:00Z") })),
    ).toBe(true);
    expect(
      evaluateTimeCondition("weekday", makeContext({ now: new Date("2026-07-15T10:00:00Z") })),
    ).toBe(true);
  });
  it("morning / evening / night", () => {
    expect(
      evaluateTimeCondition("morning", makeContext({ now: new Date("2026-07-15T08:00:00Z") })),
    ).toBe(true);
    expect(
      evaluateTimeCondition("evening", makeContext({ now: new Date("2026-07-15T18:00:00Z") })),
    ).toBe(true);
    expect(
      evaluateTimeCondition("night", makeContext({ now: new Date("2026-07-15T23:00:00Z") })),
    ).toBe(true);
  });
  it("quiet hours + focus + planner flags", () => {
    expect(
      evaluateTimeCondition("quiet_hours", makeContext({ now: new Date("2026-07-15T23:00:00Z") })),
    ).toBe(true);
    expect(
      evaluateTimeCondition("focus_session_active", makeContext({ focusSessionActive: true })),
    ).toBe(true);
    expect(
      evaluateTimeCondition("planner_generated", makeContext({ plannerGenerated: true })),
    ).toBe(true);
  });
  it("time condition on a leaf routes correctly", () => {
    const c = leaf({ timeCondition: "weekday" });
    expect(
      evaluateLeaf(c, makeEvent(), makeContext({ now: new Date("2026-07-15T10:00:00Z") })),
    ).toBe(true);
  });
});
