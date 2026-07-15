import { beforeEach, describe, expect, it } from "vitest";
import { createAutomationEngine } from "../engine";
import { planExecution } from "../executor";
import { completeRecord, startRecord } from "../history";
import { statsForRule } from "../statistics";
import { scheduleRule } from "../scheduler";
import { evaluateConditions } from "../conditions";
import { orderByPriority } from "../priority";
import { validateAutomation } from "../validation";
import { BUILTIN_AUTOMATIONS } from "../builtins";
import {
  makeContext,
  makeCounterId,
  makeEvent,
  makeRecord,
  makeRule,
  resetCounter,
} from "../fixtures";
import type { ConditionGroup, ExecutionRecord } from "../types";

describe("end-to-end automation flow", () => {
  beforeEach(() => resetCounter());

  it("create → enable → plan → record → stats", () => {
    const engine = createAutomationEngine(
      makeCounterId("r"),
      () => new Date("2026-07-15T10:00:00Z"),
    );
    let rule = engine.createRule({
      name: "Focus done → timeline",
      trigger: { kind: "focus", event: "focus.completed" },
      actions: [{ id: "a1", kind: "log_timeline_event", params: { title: "done" }, order: 0 }],
      policy: { policy: "run_always" },
    });
    rule = engine.enable(rule);

    const event = makeEvent({ kind: "focus", event: "focus.completed" });
    const plan = planExecution({ rule, event, context: makeContext(), history: [] });
    expect(plan.shouldExecute).toBe(true);

    let record = startRecord("h1", rule.id, new Date("2026-07-15T10:00:00Z"));
    record = completeRecord(record, new Date("2026-07-15T10:00:01Z"), [
      { actionId: "a1", kind: "log_timeline_event", ok: true },
    ]);
    const stats = statsForRule(rule.id, [record]);
    expect(stats.successes).toBe(1);
    expect(stats.failureRate).toBe(0);
  });

  it("built-in meeting-starts rule pauses focus only when a session is active", () => {
    const engine = createAutomationEngine(makeCounterId(), () => new Date("2026-07-15T10:00:00Z"));
    const draft = BUILTIN_AUTOMATIONS.find((b) => b.name.includes("Meeting starts"))!;
    const rule = engine.enable(engine.createRule(draft));
    const event = makeEvent({ kind: "calendar", event: "calendar.meeting_started" });

    const inactive = planExecution({
      rule,
      event,
      context: makeContext({ focusSessionActive: false }),
      history: [],
    });
    expect(inactive.shouldExecute).toBe(false);

    const active = planExecution({
      rule,
      event,
      context: makeContext({ focusSessionActive: true }),
      history: [],
    });
    expect(active.shouldExecute).toBe(true);
    expect(active.actions[0]?.kind).toBe("pause_focus");
  });

  it("cooldown built-in does not re-run within the window", () => {
    const engine = createAutomationEngine(makeCounterId(), () => new Date("2026-07-15T10:00:00Z"));
    const draft = BUILTIN_AUTOMATIONS.find((b) => b.name.includes("Water goal"))!;
    const rule = engine.enable(engine.createRule(draft));
    const history: ExecutionRecord[] = [
      makeRecord({ ruleId: rule.id, outcome: "completed", triggeredAt: "2026-07-15T09:30:00Z" }),
    ];
    const d = scheduleRule(rule, {
      now: new Date("2026-07-15T10:00:00Z"),
      timezone: "UTC",
      history,
    });
    expect(d.decision).toBe("cooldown");
  });

  it("failing action produces a failed record + failure rate", () => {
    let record = startRecord("h1", "r1", new Date("2026-07-15T10:00:00Z"));
    record = completeRecord(record, new Date("2026-07-15T10:00:01Z"), [
      { actionId: "a1", kind: "start_focus", ok: false, detail: "no task" },
    ]);
    expect(record.outcome).toBe("failed");
    const stats = statsForRule("r1", [record]);
    expect(stats.failureRate).toBe(100);
  });
});

describe("condition edge cases", () => {
  const ctx = makeContext();
  it("missing field with greater_than fails gracefully", () => {
    const group: ConditionGroup = {
      combinator: "and",
      conditions: [{ id: "c1", field: "nope", operator: "greater_than", value: 5 }],
    };
    expect(evaluateConditions(group, makeEvent(), ctx)).toBe(false);
  });

  it("nested NOT of OR", () => {
    const group: ConditionGroup = {
      combinator: "not",
      conditions: [
        { combinator: "or", conditions: [{ id: "c1", field: "x", operator: "equals", value: 1 }] },
      ],
    };
    expect(evaluateConditions(group, makeEvent({ payload: { x: 2 } }), ctx)).toBe(true);
  });

  it("metadata field resolution", () => {
    const group: ConditionGroup = {
      combinator: "and",
      conditions: [{ id: "c1", field: "origin", operator: "equals", value: "cron" }],
    };
    expect(evaluateConditions(group, makeEvent({ metadata: { origin: "cron" } }), ctx)).toBe(true);
  });
});

describe("priority + validation combined", () => {
  it("orders many rules deterministically", () => {
    const rules = [
      makeRule({ id: "b", name: "b", priority: "medium" }),
      makeRule({ id: "a", name: "a", priority: "medium" }),
      makeRule({ id: "c", name: "c", priority: "critical" }),
    ];
    expect(orderByPriority(rules).map((r) => r.id)).toEqual(["c", "a", "b"]);
  });

  it("validates all built-ins pass", () => {
    for (const b of BUILTIN_AUTOMATIONS) expect(validateAutomation(b).valid).toBe(true);
  });
});
