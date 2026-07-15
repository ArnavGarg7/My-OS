import { beforeEach, describe, expect, it } from "vitest";
import { createAutomationEngine, type AutomationEngine } from "../engine";
import { makeContext, makeCounterId, makeEvent, makeRule, resetCounter } from "../fixtures";
import type { ConditionGroup } from "../types";

function engineAt(iso: string): AutomationEngine {
  return createAutomationEngine(makeCounterId("a"), () => new Date(iso));
}

describe("AutomationEngine", () => {
  beforeEach(() => resetCounter());

  it("creates a rule from a draft", () => {
    const e = engineAt("2026-07-15T10:00:00Z");
    const rule = e.createRule({
      name: "  My rule  ",
      trigger: { kind: "task", event: "task.created" },
      actions: [{ id: "a1", kind: "noop", params: {}, order: 0 }],
    });
    expect(rule.name).toBe("My rule");
    expect(rule.status).toBe("created");
    expect(rule.priority).toBe("medium");
    expect(rule.id).toBe("a-1");
  });

  it("enable/disable/archive transition status", () => {
    const e = engineAt("2026-07-15T10:00:00Z");
    const rule = makeRule({ status: "created" });
    expect(e.enable(rule).status).toBe("enabled");
    expect(e.disable(rule).status).toBe("disabled");
    expect(e.archive(rule).status).toBe("archived");
  });

  it("update patches fields", () => {
    const e = engineAt("2026-07-15T10:00:00Z");
    const updated = e.update(makeRule(), { name: "Renamed", priority: "high" });
    expect(updated.name).toBe("Renamed");
    expect(updated.priority).toBe("high");
  });

  it("planForEvent returns matched rules ordered by priority", () => {
    const e = engineAt("2026-07-15T10:00:00Z");
    const rules = [
      makeRule({ id: "low", priority: "low" }),
      makeRule({ id: "crit", priority: "critical" }),
      makeRule({ id: "focus", trigger: { kind: "focus", event: "focus.completed" } }),
    ];
    const plans = e.planForEvent(rules, makeEvent(), makeContext(), []);
    expect(plans.map((p) => p.rule.id)).toEqual(["crit", "low"]);
    expect(plans[0]?.plan.shouldExecute).toBe(true);
  });

  it("preview simulates without executing", () => {
    const e = engineAt("2026-07-15T10:00:00Z");
    const preview = e.preview(makeRule(), makeEvent(), makeContext());
    expect(preview.triggerMatches).toBe(true);
    expect(preview.conditionsPass).toBe(true);
    expect(preview.wouldExecute).toBe(true);
    expect(preview.actions).toHaveLength(1);
    expect(preview.expectedResult).toContain("notification");
  });

  it("preview explains a non-match", () => {
    const e = engineAt("2026-07-15T10:00:00Z");
    const preview = e.preview(
      makeRule({ trigger: { kind: "focus", event: "focus.completed" } }),
      makeEvent(),
      makeContext(),
    );
    expect(preview.wouldExecute).toBe(false);
    expect(preview.reason).toContain("Trigger does not match");
  });

  it("preview reports failing conditions", () => {
    const e = engineAt("2026-07-15T10:00:00Z");
    const conditions: ConditionGroup = {
      combinator: "and",
      conditions: [{ id: "c1", field: "count", operator: "greater_than", value: 100 }],
    };
    const preview = e.preview(
      makeRule({ conditions }),
      makeEvent({ payload: { count: 1 } }),
      makeContext(),
    );
    expect(preview.conditionsPass).toBe(false);
    expect(preview.wouldExecute).toBe(false);
  });

  it("validate rejects a recursive rule", () => {
    const e = engineAt("2026-07-15T10:00:00Z");
    const result = e.validate({
      name: "loop",
      trigger: { kind: "planner", event: "planner.generated" },
      actions: [{ id: "a1", kind: "regenerate_planner", params: {}, order: 0 }],
    });
    expect(result.valid).toBe(false);
  });
});
