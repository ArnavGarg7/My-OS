import { describe, expect, it } from "vitest";
import { ACTION_KINDS, EXECUTION_POLICIES, TRIGGER_KINDS, PRIORITY_RANK } from "../constants";
import { makeTrigger, rulesForEvent, triggerMatches } from "../triggers";
import { makeAction, orderedActions, summarizeAction, isActionKind } from "../actions";
import { comparePriority, orderByPriority } from "../priority";
import { completeRecord, outcomeRecord, startRecord } from "../history";
import { parseActionKind, parseTriggerKind, isTriggerKind } from "../parser";
import { BUILTIN_AUTOMATIONS } from "../builtins";
import { validateAutomation } from "../validation";
import {
  builtInRules,
  customRules,
  enabledRules,
  pendingExecutions,
  recentFailures,
} from "../selectors";
import { makeEvent, makeRecord, makeRule } from "../fixtures";

describe("constants", () => {
  it("defines 17 trigger kinds, 18 action kinds, 9 policies", () => {
    expect(TRIGGER_KINDS).toHaveLength(17);
    expect(ACTION_KINDS).toHaveLength(18);
    expect(EXECUTION_POLICIES).toHaveLength(9);
  });
  it("priority rank orders critical highest", () => {
    expect(PRIORITY_RANK.critical).toBeGreaterThan(PRIORITY_RANK.low);
  });
});

describe("triggers", () => {
  it("builds a trigger event", () => {
    const t = makeTrigger("t1", "focus", "focus.completed", new Date("2026-07-15T10:00:00Z"), {
      x: 1,
    });
    expect(t.kind).toBe("focus");
    expect(t.event).toBe("focus.completed");
    expect(t.payload).toEqual({ x: 1 });
  });
  it("matches by kind + event; wildcard matches any", () => {
    expect(triggerMatches(makeRule(), makeEvent())).toBe(true);
    expect(
      triggerMatches(
        makeRule({ trigger: { kind: "planner", event: "*" } }),
        makeEvent({ event: "planner.cleared" }),
      ),
    ).toBe(true);
  });
  it("rulesForEvent returns enabled matches only", () => {
    const rules = [
      makeRule({ id: "on", status: "enabled" }),
      makeRule({ id: "off", status: "disabled" }),
    ];
    expect(rulesForEvent(rules, makeEvent()).map((r) => r.id)).toEqual(["on"]);
  });
});

describe("actions", () => {
  it("summarizes each action kind", () => {
    for (const kind of ACTION_KINDS) {
      expect(summarizeAction(makeAction("a", kind, 0)).length).toBeGreaterThan(0);
    }
  });
  it("orders actions", () => {
    const actions = [makeAction("b", "noop", 2), makeAction("a", "noop", 1)];
    expect(orderedActions(actions).map((a) => a.id)).toEqual(["a", "b"]);
  });
  it("isActionKind validates", () => {
    expect(isActionKind("start_focus")).toBe(true);
    expect(isActionKind("nope")).toBe(false);
  });
});

describe("priority", () => {
  it("compares and orders", () => {
    expect(comparePriority("critical", "low")).toBeLessThan(0);
    const rules = [makeRule({ id: "l", priority: "low" }), makeRule({ id: "h", priority: "high" })];
    expect(orderByPriority(rules).map((r) => r.id)).toEqual(["h", "l"]);
  });
});

describe("history builders", () => {
  it("starts, completes and marks outcome", () => {
    const now = new Date("2026-07-15T10:00:00Z");
    const rec = startRecord("h1", "r1", now);
    expect(rec.outcome).toBe("triggered");
    const done = completeRecord(rec, new Date("2026-07-15T10:00:02Z"), [
      { actionId: "a1", kind: "noop", ok: true },
    ]);
    expect(done.outcome).toBe("completed");
    expect(done.runtimeMs).toBe(2000);
    const failed = completeRecord(rec, new Date("2026-07-15T10:00:01Z"), [
      { actionId: "a1", kind: "noop", ok: false },
    ]);
    expect(failed.outcome).toBe("failed");
    expect(outcomeRecord(rec, "skipped", now).outcome).toBe("skipped");
  });
});

describe("parser", () => {
  it("parses trigger + action kinds with aliases", () => {
    expect(parseTriggerKind("plan")).toBe("planner");
    expect(parseTriggerKind("meeting")).toBe("calendar");
    expect(parseTriggerKind("nonsense")).toBeNull();
    expect(parseActionKind("notify")).toBe("generate_notification");
    expect(parseActionKind("reminder")).toBe("create_reminder");
    expect(isTriggerKind("focus")).toBe(true);
  });
});

describe("built-in automations", () => {
  it("ships 9 valid built-in rules", () => {
    expect(BUILTIN_AUTOMATIONS).toHaveLength(9);
    for (const b of BUILTIN_AUTOMATIONS) {
      expect(b.builtIn).toBe(true);
      expect(validateAutomation(b).valid).toBe(true);
    }
  });
  it("built-ins call existing services (no business logic)", () => {
    const kinds = BUILTIN_AUTOMATIONS.flatMap((b) => b.actions.map((a) => a.kind));
    expect(kinds).toContain("generate_notification");
    expect(kinds).toContain("pause_focus");
    expect(kinds).toContain("resume_focus");
  });
});

describe("selectors", () => {
  it("filters enabled / built-in / custom", () => {
    const rules = [
      makeRule({ id: "a", status: "enabled", builtIn: true }),
      makeRule({ id: "b", status: "disabled", builtIn: false }),
    ];
    expect(enabledRules(rules).map((r) => r.id)).toEqual(["a"]);
    expect(builtInRules(rules).map((r) => r.id)).toEqual(["a"]);
    expect(customRules(rules).map((r) => r.id)).toEqual(["b"]);
  });
  it("pending + failures", () => {
    const history = [
      makeRecord({ id: "1", outcome: "pending_approval" }),
      makeRecord({ id: "2", outcome: "failed" }),
    ];
    expect(pendingExecutions(history)).toHaveLength(1);
    expect(recentFailures(history)).toHaveLength(1);
  });
});
