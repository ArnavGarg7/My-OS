import { describe, expect, it } from "vitest";
import { collectCarryForward, confirmCarryForward } from "./carryforward";
import { makeCarryForward } from "./fixtures";
import type { CarryForwardCandidate } from "./types";

describe("collectCarryForward", () => {
  it("orders by kind then priority and tallies", () => {
    const list = collectCarryForward(makeCarryForward());
    expect(list.total).toBe(5);
    expect(list.items[0]!.kind).toBe("task");
    // high-priority task before medium
    expect(list.items[0]!.title).toBe("Finish report");
    expect(list.byKind.task).toBe(2);
    expect(list.byKind.milestone).toBe(1);
  });
  it("flags overload past the threshold", () => {
    const many: CarryForwardCandidate[] = Array.from({ length: 9 }, (_, i) => ({
      id: `x${i}`,
      kind: "task",
      title: `Task ${i}`,
      reason: "Overdue",
      entityId: `t${i}`,
    }));
    expect(collectCarryForward(many).overloaded).toBe(true);
    expect(collectCarryForward(makeCarryForward()).overloaded).toBe(false);
  });
  it("is empty-safe", () => {
    const list = collectCarryForward([]);
    expect(list.total).toBe(0);
    expect(list.overloaded).toBe(false);
  });
});

describe("confirmCarryForward", () => {
  it("returns only the accepted candidates", () => {
    const list = collectCarryForward(makeCarryForward());
    const accepted = confirmCarryForward(list, ["cf1", "cf3"]);
    expect(accepted.map((c) => c.id).sort()).toEqual(["cf1", "cf3"]);
  });
  it("accepts nothing by default", () => {
    const list = collectCarryForward(makeCarryForward());
    expect(confirmCarryForward(list, [])).toHaveLength(0);
  });
  it("ignores unknown ids", () => {
    const list = collectCarryForward(makeCarryForward());
    expect(confirmCarryForward(list, ["nope"])).toHaveLength(0);
  });
});

describe("carry-forward ordering", () => {
  it("groups every kind + tallies byKind", () => {
    const list = collectCarryForward(makeCarryForward());
    expect(list.byKind.decision).toBe(1);
    expect(list.byKind.inbox).toBe(1);
    expect(list.byKind.planner_block).toBe(0);
  });
  it("orders tasks before milestones before inbox", () => {
    const list = collectCarryForward(makeCarryForward());
    const kinds = list.items.map((i) => i.kind);
    expect(kinds.indexOf("task")).toBeLessThan(kinds.indexOf("milestone"));
    expect(kinds.indexOf("milestone")).toBeLessThan(kinds.indexOf("inbox"));
  });
});
