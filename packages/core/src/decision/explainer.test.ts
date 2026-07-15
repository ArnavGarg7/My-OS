import { describe, expect, it } from "vitest";
import { explainDecision } from "./explainer";
import { at, makeContext, makeDecision } from "./fixtures";

describe("explainDecision", () => {
  it("returns rule, reason, confidence, inputs, score and breakdown", () => {
    const decision = makeDecision({
      ruleId: "continue-mission",
      reason: "Working hours have begun.",
      confidence: 92,
      inputsUsed: ["Time", "Mission", "Energy", "Planner"],
      type: "focus",
      priority: "high",
    });
    const ex = explainDecision(decision, makeContext({ now: at(10) }));
    expect(ex.rule).toBe("Working hours have begun");
    expect(ex.reason).toBe("Working hours have begun.");
    expect(ex.confidence).toBe(92);
    expect(ex.inputs).toContain("Mission");
    expect(ex.score).toBeGreaterThan(0);
    expect(ex.breakdown.length).toBeGreaterThan(0);
  });

  it("falls back to the ruleId when the rule is unknown", () => {
    expect(explainDecision(makeDecision({ ruleId: "unknown-rule" }), makeContext()).rule).toBe(
      "unknown-rule",
    );
  });
});
