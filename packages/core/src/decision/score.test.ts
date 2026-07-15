import { describe, expect, it } from "vitest";
import { scoreDecision } from "./score";
import { PRIORITY_WEIGHT } from "./constants";
import { at, makeContext, makeDecision, makeState } from "./fixtures";

describe("scoreDecision", () => {
  it("starts from the priority weight", () => {
    const { score, breakdown } = scoreDecision(
      makeDecision({ priority: "low", type: "system" }),
      makeContext({ now: at(10) }),
    );
    expect(breakdown[0]?.value).toBe(PRIORITY_WEIGHT.low);
    expect(score).toBeGreaterThanOrEqual(PRIORITY_WEIGHT.low);
  });

  it("boosts focus/mission decisions within working hours", () => {
    const inHours = scoreDecision(
      makeDecision({ priority: "medium", type: "focus" }),
      makeContext({ now: at(10) }),
    ).score;
    const outHours = scoreDecision(
      makeDecision({ priority: "medium", type: "focus" }),
      makeContext({ now: at(7) }),
    ).score;
    expect(inHours).toBeGreaterThan(outHours);
  });

  it("adds an expiring-soon boost", () => {
    const soon = scoreDecision(
      makeDecision({ priority: "low", type: "system", expiresAt: at(10, 30).toISOString() }),
      makeContext({ now: at(10) }),
    );
    expect(soon.breakdown.some((b) => b.label === "Expiring soon")).toBe(true);
  });

  it("rewards high energy on focus decisions", () => {
    const s = scoreDecision(
      makeDecision({ priority: "medium", type: "focus" }),
      makeContext({ now: at(10), state: makeState({ energyLevel: "high" }) }),
    );
    expect(s.breakdown.some((b) => b.label === "High energy fits focus")).toBe(true);
  });

  it("clamps to 0–100", () => {
    const s = scoreDecision(
      makeDecision({ priority: "critical", type: "focus", expiresAt: at(10, 10).toISOString() }),
      makeContext({ now: at(10), state: makeState({ energyLevel: "high" }) }),
    );
    expect(s.score).toBeLessThanOrEqual(100);
    expect(s.score).toBeGreaterThanOrEqual(0);
  });

  it("is deterministic", () => {
    const a = scoreDecision(makeDecision(), makeContext({ now: at(10) })).score;
    const b = scoreDecision(makeDecision(), makeContext({ now: at(10) })).score;
    expect(a).toBe(b);
  });
});
