import { describe, expect, it } from "vitest";
import { makeKeyResult } from "./fixtures";
import { isKeyResultComplete, keyResultProgress, updateKeyResult } from "./key-results";

describe("key-results", () => {
  it("computes numeric progress toward target", () => {
    expect(
      keyResultProgress(
        makeKeyResult({ metricType: "numeric", currentValue: 8.9, targetValue: 9 }),
      ),
    ).toBe(99);
  });

  it("caps numeric progress at 100", () => {
    expect(keyResultProgress(makeKeyResult({ currentValue: 12, targetValue: 9 }))).toBe(100);
  });

  it("treats percentage as its own value", () => {
    expect(keyResultProgress(makeKeyResult({ metricType: "percentage", currentValue: 65 }))).toBe(
      65,
    );
  });

  it("treats boolean + milestone as 0/100", () => {
    expect(keyResultProgress(makeKeyResult({ metricType: "boolean", currentValue: 0 }))).toBe(0);
    expect(keyResultProgress(makeKeyResult({ metricType: "milestone", currentValue: 1 }))).toBe(
      100,
    );
  });

  it("reports completion", () => {
    expect(isKeyResultComplete(makeKeyResult({ status: "completed" }))).toBe(true);
    expect(isKeyResultComplete(makeKeyResult({ currentValue: 9, targetValue: 9 }))).toBe(true);
  });

  it("updates value and auto-completes at target", () => {
    const kr = updateKeyResult(makeKeyResult({ currentValue: 5, targetValue: 9 }), 9);
    expect(kr.currentValue).toBe(9);
    expect(kr.status).toBe("completed");
  });

  it("stays active below target on update", () => {
    expect(updateKeyResult(makeKeyResult({ targetValue: 9 }), 4).status).toBe("active");
  });
});
