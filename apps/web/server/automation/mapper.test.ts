import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { historyRowToRecord, ruleToColumns, rowToRule } from "./mapper";
import { makeRule } from "@myos/core/automation";
import type {
  AutomationActionRow,
  AutomationConditionRow,
  AutomationHistoryRow,
  AutomationRuleRow,
} from "@myos/db/schema";

const ruleRow: AutomationRuleRow = {
  id: "r1",
  name: "Rule",
  description: "desc",
  status: "enabled",
  priority: "high",
  triggerKind: "planner",
  triggerEvent: "planner.generated",
  policy: { policy: "cooldown", cooldownMinutes: 60 },
  builtIn: false,
  createdAt: new Date("2026-07-15T09:00:00Z"),
  updatedAt: new Date("2026-07-15T09:30:00Z"),
};

const condRow: AutomationConditionRow = {
  id: "c1",
  ruleId: "r1",
  tree: { combinator: "and", conditions: [{ id: "l1", field: "x", operator: "equals", value: 1 }] },
};

const actionRows: AutomationActionRow[] = [
  { id: "a2", ruleId: "r1", kind: "noop", params: {}, actionOrder: 2 },
  { id: "a1", ruleId: "r1", kind: "log_timeline_event", params: { title: "x" }, actionOrder: 1 },
];

describe("automation mappers", () => {
  it("maps a rule row + conditions + actions to the domain", () => {
    const rule = rowToRule(ruleRow, condRow, actionRows);
    expect(rule.name).toBe("Rule");
    expect(rule.priority).toBe("high");
    expect(rule.trigger).toEqual({ kind: "planner", event: "planner.generated" });
    expect(rule.actions.map((a) => a.id)).toEqual(["a1", "a2"]); // sorted by order
    expect(rule.conditions.conditions).toHaveLength(1);
  });

  it("defaults conditions when none stored", () => {
    const rule = rowToRule(ruleRow, undefined, []);
    expect(rule.conditions.combinator).toBe("and");
    expect(rule.conditions.conditions).toHaveLength(0);
  });

  it("maps a domain rule back to columns", () => {
    const cols = ruleToColumns(makeRule({ name: "X", priority: "low" }));
    expect(cols.name).toBe("X");
    expect(cols.priority).toBe("low");
    expect(cols.triggerKind).toBe("planner");
    expect(cols.updatedAt).toBeInstanceOf(Date);
  });

  it("maps a history row to an execution record", () => {
    const row: AutomationHistoryRow = {
      id: "h1",
      ruleId: "r1",
      outcome: "completed",
      triggeredAt: new Date("2026-07-15T10:00:00Z"),
      completedAt: new Date("2026-07-15T10:00:01Z"),
      runtimeMs: 1000,
      actionResults: [{ actionId: "a1", kind: "noop", ok: true }],
      error: null,
    };
    const rec = historyRowToRecord(row);
    expect(rec.outcome).toBe("completed");
    expect(rec.runtimeMs).toBe(1000);
    expect(rec.actionResults).toHaveLength(1);
  });

  it("handles a null completedAt", () => {
    const row: AutomationHistoryRow = {
      id: "h2",
      ruleId: "r1",
      outcome: "skipped",
      triggeredAt: new Date("2026-07-15T10:00:00Z"),
      completedAt: null,
      runtimeMs: null,
      actionResults: [],
      error: null,
    };
    expect(historyRowToRecord(row).completedAt).toBeNull();
  });
});
