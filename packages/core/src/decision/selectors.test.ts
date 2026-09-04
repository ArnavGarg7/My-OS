import { describe, expect, it } from "vitest";
import {
  rankDecisions,
  selectActionable,
  selectCurrentDecision,
  selectDecisionStatus,
  selectHistory,
  selectPending,
} from "./selectors";
import { at, makeDecision } from "./fixtures";

describe("rankDecisions", () => {
  it("orders by priority then score", () => {
    const list = [
      makeDecision({ ruleId: "a", priority: "low", score: 90 }),
      makeDecision({ ruleId: "b", priority: "critical", score: 10 }),
      makeDecision({ ruleId: "c", priority: "high", score: 80 }),
      makeDecision({ ruleId: "d", priority: "high", score: 95 }),
    ];
    expect(rankDecisions(list).map((d) => d.ruleId)).toEqual(["b", "d", "c", "a"]);
  });
});

describe("selectPending / selectCurrentDecision", () => {
  it("ignores non-pending and returns the top", () => {
    const list = [
      makeDecision({ ruleId: "x", state: "accepted", priority: "critical" }),
      makeDecision({ ruleId: "y", state: "pending", priority: "high", score: 70 }),
      makeDecision({ ruleId: "z", state: "pending", priority: "medium", score: 90 }),
    ];
    expect(selectPending(list).map((d) => d.ruleId)).toEqual(["y", "z"]);
    expect(selectCurrentDecision(list)?.ruleId).toBe("y");
  });
  it("returns null with no pending", () => {
    expect(selectCurrentDecision([makeDecision({ state: "completed" })])).toBeNull();
  });
});

describe("selectActionable", () => {
  const now = at(12);
  it("keeps only pending, unexpired, one-per-rule", () => {
    const list = [
      makeDecision({ ruleId: "a", state: "pending", expiresAt: at(14).toISOString() }),
      makeDecision({ ruleId: "a", state: "pending", expiresAt: at(15).toISOString() }), // dup rule
      makeDecision({ ruleId: "b", state: "pending", expiresAt: at(9).toISOString() }), // expired
      makeDecision({ ruleId: "c", state: "accepted", expiresAt: at(15).toISOString() }), // resolved
      makeDecision({ ruleId: "d", state: "pending", expiresAt: null }),
    ];
    expect(selectActionable(list, now).map((d) => d.ruleId)).toEqual(["a", "d"]);
  });
});

describe("selectHistory", () => {
  it("is newest-first", () => {
    const list = [
      makeDecision({ ruleId: "old", createdAt: at(8).toISOString() }),
      makeDecision({ ruleId: "new", createdAt: at(11).toISOString() }),
    ];
    expect(selectHistory(list).map((d) => d.ruleId)).toEqual(["new", "old"]);
  });
});

describe("selectDecisionStatus", () => {
  it("prefers pending, then accepted, then deferred, else idle", () => {
    expect(selectDecisionStatus([makeDecision({ state: "pending" })])).toBe("pending");
    expect(selectDecisionStatus([makeDecision({ state: "accepted" })])).toBe("accepted");
    expect(selectDecisionStatus([makeDecision({ state: "deferred" })])).toBe("deferred");
    expect(selectDecisionStatus([makeDecision({ state: "completed" })])).toBe("idle");
    expect(selectDecisionStatus([])).toBe("idle");
  });
});
