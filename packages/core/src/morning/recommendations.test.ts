import { describe, expect, it } from "vitest";
import { generateRecommendation } from "./recommendations";
import { at, makeContext, makeFocus, makeMetrics, makeState } from "./fixtures";

describe("generateRecommendation (deterministic, priority-ordered)", () => {
  it("recommends preparing before working hours", () => {
    expect(generateRecommendation(makeContext({ now: at(7) })).id).toBe("before-working-hours");
  });

  it("recommends setting a mission when none exists", () => {
    const rec = generateRecommendation(makeContext({ now: at(10) }));
    expect(rec.id).toBe("no-mission");
    expect(rec.decision).toBe("You have no mission set.");
  });

  it("recommends lighter work when energy is low", () => {
    expect(
      generateRecommendation(
        makeContext({
          now: at(10),
          focus: makeFocus({ mission: "M" }),
          state: makeState({ energyLevel: "low" }),
        }),
      ).id,
    ).toBe("low-energy");
  });

  it("recommends focus mode after many interruptions", () => {
    expect(
      generateRecommendation(
        makeContext({
          now: at(10),
          focus: makeFocus({ mission: "M" }),
          state: makeState({ energyLevel: "high" }),
          metrics: makeMetrics({ interruptions: 12 }),
        }),
      ).id,
    ).toBe("high-interruptions");
  });

  it("explains a low focus score with no schedule", () => {
    expect(
      generateRecommendation(
        makeContext({
          now: at(10),
          focus: makeFocus({ mission: "M" }),
          state: makeState({ energyLevel: "medium", focusScore: 30 }),
        }),
      ).id,
    ).toBe("low-focus-no-schedule");
  });

  it("nudges the morning check-in when otherwise set", () => {
    expect(
      generateRecommendation(
        makeContext({
          now: at(10),
          focus: makeFocus({ mission: "M", deepWork: "D" }),
          state: makeState({ energyLevel: "high", focusScore: 80, morningCompleted: false }),
        }),
      ).id,
    ).toBe("morning-not-complete");
  });

  it("falls back to all-set when everything is defined", () => {
    const rec = generateRecommendation(
      makeContext({
        now: at(10),
        focus: makeFocus({ mission: "M", deepWork: "D" }),
        state: makeState({ energyLevel: "high", focusScore: 80, morningCompleted: true }),
      }),
    );
    expect(rec.id).toBe("all-set");
    expect(rec.confidence).toBeGreaterThan(0);
  });
});
