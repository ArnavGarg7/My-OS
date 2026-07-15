import { describe, expect, it } from "vitest";
import { RECOMMENDATION_RULES, type RecommendationRule } from "./rules";
import { at, makeContext, makeFocus, makeMetrics, makeState } from "./fixtures";

const rule = (id: string): RecommendationRule => {
  const found = RECOMMENDATION_RULES.find((r) => r.id === id);
  if (!found) throw new Error(`no rule ${id}`);
  return found;
};

describe("recommendation rules — matching", () => {
  it("before-working-hours matches only before the start", () => {
    expect(rule("before-working-hours").matches(makeContext({ now: at(7) }))).toBe(true);
    expect(rule("before-working-hours").matches(makeContext({ now: at(10) }))).toBe(false);
  });

  it("no-mission matches when the mission is blank", () => {
    expect(rule("no-mission").matches(makeContext())).toBe(true);
    expect(rule("no-mission").matches(makeContext({ focus: makeFocus({ mission: "M" }) }))).toBe(
      false,
    );
    expect(rule("no-mission").matches(makeContext({ focus: makeFocus({ mission: "   " }) }))).toBe(
      true,
    );
  });

  it("low-energy matches only for low energy", () => {
    expect(
      rule("low-energy").matches(makeContext({ state: makeState({ energyLevel: "low" }) })),
    ).toBe(true);
    expect(
      rule("low-energy").matches(makeContext({ state: makeState({ energyLevel: "high" }) })),
    ).toBe(false);
  });

  it("high-interruptions matches above the threshold", () => {
    expect(
      rule("high-interruptions").matches(
        makeContext({ metrics: makeMetrics({ interruptions: 11 }) }),
      ),
    ).toBe(true);
    expect(
      rule("high-interruptions").matches(
        makeContext({ metrics: makeMetrics({ interruptions: 10 }) }),
      ),
    ).toBe(false);
  });

  it("low-focus-no-schedule needs a low score AND no deep work", () => {
    expect(
      rule("low-focus-no-schedule").matches(makeContext({ state: makeState({ focusScore: 30 }) })),
    ).toBe(true);
    expect(
      rule("low-focus-no-schedule").matches(
        makeContext({ state: makeState({ focusScore: 30 }), focus: makeFocus({ deepWork: "D" }) }),
      ),
    ).toBe(false);
  });

  it("morning-not-complete matches until completed", () => {
    expect(rule("morning-not-complete").matches(makeContext())).toBe(true);
    expect(
      rule("morning-not-complete").matches(
        makeContext({ state: makeState({ morningCompleted: true }) }),
      ),
    ).toBe(false);
  });

  it("all-set always matches (the fallback)", () => {
    expect(rule("all-set").matches(makeContext())).toBe(true);
  });
});

describe("recommendation rules — priority", () => {
  it("before-working-hours has the highest priority and all-set the lowest", () => {
    const priorities = RECOMMENDATION_RULES.map((r) => r.priority);
    expect(rule("before-working-hours").priority).toBe(Math.max(...priorities));
    expect(rule("all-set").priority).toBe(Math.min(...priorities));
  });
});
