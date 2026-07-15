import { describe, expect, it } from "vitest";
import {
  canFinalize,
  isReady,
  nextStep,
  previousStep,
  stepIndex,
  studioProgress,
} from "./preparation";
import { checklistProgress, defaultChecklist } from "./checklist";
import { computeReadiness } from "./readiness";
import { rankPriorities } from "./priorities";
import { makePriorities, makeReadinessInput } from "./fixtures";

describe("step navigation", () => {
  it("advances + retreats through the flow", () => {
    expect(nextStep("review")).toBe("carry_forward");
    expect(nextStep("finalize")).toBeNull();
    expect(previousStep("review")).toBeNull();
    expect(previousStep("priorities")).toBe("carry_forward");
  });
  it("indexes + computes progress", () => {
    expect(stepIndex("review")).toBe(0);
    expect(studioProgress("review")).toBe(0);
    expect(studioProgress("finalize")).toBe(100);
  });
});

describe("canFinalize + isReady", () => {
  const priorities = rankPriorities(makePriorities());
  it("requires priorities + all required checklist items", () => {
    const incomplete = checklistProgress(defaultChecklist());
    expect(canFinalize(priorities, incomplete)).toBe(false);

    const done = checklistProgress(
      defaultChecklist().map((i) => (i.required ? { ...i, completed: true } : i)),
    );
    expect(canFinalize(priorities, done)).toBe(true);
  });
  it("blocks finalisation with no priorities", () => {
    const done = checklistProgress(
      defaultChecklist().map((i) => (i.required ? { ...i, completed: true } : i)),
    );
    expect(canFinalize({ top: [] }, done)).toBe(false);
  });
  it("isReady requires finalisable + positive readiness", () => {
    const readiness = computeReadiness(makeReadinessInput());
    expect(isReady(true, readiness)).toBe(true);
    expect(isReady(false, readiness)).toBe(false);
  });
  it("progress is monotonic across the flow", () => {
    expect(studioProgress("carry_forward")).toBeGreaterThan(studioProgress("review"));
    expect(studioProgress("readiness")).toBeGreaterThan(studioProgress("calendar"));
  });
  it("indexes the last step", () => {
    expect(stepIndex("finalize")).toBe(7);
  });
});
