import { describe, expect, it } from "vitest";
import { validateAutomation } from "../validation";
import { makeRule } from "../fixtures";
import type { AutomationDraft } from "../types";

function draft(over: Partial<AutomationDraft> = {}): AutomationDraft {
  return {
    name: "My rule",
    trigger: { kind: "task", event: "task.created" },
    actions: [{ id: "a1", kind: "generate_notification", params: {}, order: 0 }],
    policy: { policy: "run_always" },
    ...over,
  };
}

describe("validation", () => {
  it("accepts a valid draft", () => {
    expect(validateAutomation(draft()).valid).toBe(true);
  });

  it("requires a name", () => {
    const r = validateAutomation(draft({ name: "" }));
    expect(r.valid).toBe(false);
    expect(r.issues.some((i) => i.code === "name-required")).toBe(true);
  });

  it("requires at least one action", () => {
    const r = validateAutomation(draft({ actions: [] }));
    expect(r.issues.some((i) => i.code === "no-actions")).toBe(true);
  });

  it("detects recursion (action re-fires own trigger)", () => {
    const r = validateAutomation(
      draft({
        trigger: { kind: "planner", event: "planner.generated" },
        actions: [{ id: "a1", kind: "generate_planner", params: {}, order: 0 }],
      }),
    );
    expect(r.issues.some((i) => i.code === "recursive")).toBe(true);
  });

  it("detects duplicate rules", () => {
    const existing = [
      makeRule({ id: "x", name: "My rule", trigger: { kind: "task", event: "task.created" } }),
    ];
    const r = validateAutomation(draft(), existing);
    expect(r.issues.some((i) => i.code === "duplicate")).toBe(true);
  });

  it("flags a bad between condition", () => {
    const r = validateAutomation(
      draft({
        conditions: {
          combinator: "and",
          conditions: [{ id: "c1", field: "x", operator: "between", value: 5 }],
        },
      }),
    );
    expect(r.issues.some((i) => i.code === "bad-between")).toBe(true);
  });

  it("flags a bad date condition", () => {
    const r = validateAutomation(
      draft({
        conditions: {
          combinator: "and",
          conditions: [{ id: "c1", field: "x", operator: "after", value: "not-a-date" }],
        },
      }),
    );
    expect(r.issues.some((i) => i.code === "bad-date")).toBe(true);
  });

  it("flags an impossible schedule time", () => {
    const r = validateAutomation(draft({ policy: { policy: "schedule", scheduleAt: "9am" } }));
    expect(r.issues.some((i) => i.code === "bad-schedule")).toBe(true);
  });

  it("flags a bad max_executions", () => {
    const r = validateAutomation(draft({ policy: { policy: "max_executions", maxExecutions: 0 } }));
    expect(r.issues.some((i) => i.code === "bad-max")).toBe(true);
  });
});
