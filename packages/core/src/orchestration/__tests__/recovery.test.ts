import { describe, expect, it } from "vitest";
import { DEFAULT_RECOVERY, decideRecovery, isRecoverable } from "../recovery";
import { makePlan } from "../fixtures";

const plan = makePlan();

describe("recovery engine", () => {
  it("planner failure retries the step", () => {
    const d = decideRecovery("planner", plan, 0);
    expect(d.strategy).toBe("retry_step");
    expect(d.skip).toEqual([]);
  });

  it("planner degrades to skip after the retry limit", () => {
    const d = decideRecovery("planner", plan, 2);
    expect(d.strategy).toBe("skip_step");
  });

  it("calendar failure skips downstream", () => {
    const d = decideRecovery("calendar", plan, 0);
    expect(d.strategy).toBe("skip_downstream");
    expect(d.skip).toContain("planner");
  });

  it("health unavailable uses the previous value", () => {
    const d = decideRecovery("health", plan, 0);
    expect(d.strategy).toBe("use_previous");
    expect(d.reason).toContain("previous");
  });

  it("timeline failure skips downstream (analytics too)", () => {
    const d = decideRecovery("timeline", plan, 0);
    expect(d.strategy).toBe("skip_downstream");
    expect(d.skip).toContain("analytics");
  });

  it("notification failure skips only that step", () => {
    const d = decideRecovery("notification", plan, 0);
    expect(d.strategy).toBe("skip_step");
  });

  it("every module has a default strategy", () => {
    for (const strat of Object.values(DEFAULT_RECOVERY)) {
      expect(typeof strat).toBe("string");
    }
  });

  it("isRecoverable is true unless abort", () => {
    expect(isRecoverable("retry_step")).toBe(true);
    expect(isRecoverable("abort")).toBe(false);
  });
});
