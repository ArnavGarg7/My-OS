import { describe, expect, it } from "vitest";
import { clampScore, directionOf, levelForScore, levelForTrend, round1 } from "./bands";
import {
  decliningAreas,
  improvingAreas,
  lifeArea,
  lifeAreas,
  lifeBalance,
  overallLifeScore,
  relationshipsScore,
} from "./life-areas";
import { wheelFullness, wheelOfLife } from "./wheel";
import { makeInput } from "./fixtures";

describe("bands — the one score-to-word mapping", () => {
  it("clamps and rounds scores into 0..100", () => {
    expect(clampScore(150)).toBe(100);
    expect(clampScore(-5)).toBe(0);
    expect(clampScore(72.6)).toBe(73);
  });

  it("bands scores into the five levels", () => {
    expect(levelForScore(85)).toBe("excellent");
    expect(levelForScore(70)).toBe("improving");
    expect(levelForScore(55)).toBe("stable");
    expect(levelForScore(40)).toBe("at_risk");
    expect(levelForScore(20)).toBe("needs_attention");
  });

  it("direction respects a dead-band so noise reads as flat", () => {
    expect(directionOf(80, 76)).toBe("rising");
    expect(directionOf(76, 80)).toBe("falling");
    expect(directionOf(78, 77)).toBe("flat");
    expect(directionOf(78, null)).toBe("flat");
  });

  it("a falling excellent area is demoted to at_risk — direction matters", () => {
    expect(levelForTrend(85, "falling")).toBe("at_risk");
    expect(levelForTrend(55, "rising")).toBe("improving");
    expect(levelForTrend(85, "flat")).toBe("excellent");
  });

  it("round1 keeps one decimal", () => {
    expect(round1(0.666)).toBe(0.7);
  });
});

describe("life areas — rolls owned scores up, never recomputes", () => {
  it("maps each area to its owned score", () => {
    const areas = lifeAreas(makeInput());
    expect(areas).toHaveLength(8);
    const health = areas.find((a) => a.area === "health");
    // health area reads readiness (78), NOT a recomputed number.
    expect(health?.score).toBe(78);
  });

  it("derives velocity + trend from the previous value", () => {
    const area = lifeArea(
      makeInput({ health: { readiness: 78, recovery: 74, previousReadiness: 70 } }),
      "health",
    );
    expect(area.velocity).toBe(8);
    expect(area.trend).toBe("rising");
  });

  it("relationships score bands the CRM counts, penalising follow-ups", () => {
    const strong = relationshipsScore(
      makeInput({
        resources: {
          ...makeInput().resources,
          relationshipsStrong: 4,
          relationshipsDormant: 0,
          followUpsDue: 0,
        },
      }),
    );
    expect(strong).toBe(100);
    const penalised = relationshipsScore(
      makeInput({
        resources: {
          ...makeInput().resources,
          relationshipsStrong: 4,
          relationshipsDormant: 0,
          followUpsDue: 2,
        },
      }),
    );
    expect(penalised).toBe(90);
  });

  it("relationships score is neutral 50 with no known ties", () => {
    expect(
      relationshipsScore(
        makeInput({
          resources: { ...makeInput().resources, relationshipsStrong: 0, relationshipsDormant: 0 },
        }),
      ),
    ).toBe(50);
  });

  it("overall is a weighted roll-up of the eight areas", () => {
    const areas = lifeAreas(makeInput());
    const overall = overallLifeScore(areas);
    expect(overall).toBeGreaterThan(0);
    expect(overall).toBeLessThanOrEqual(100);
  });

  it("life balance identifies strongest and weakest and flags a wide spread", () => {
    const balance = lifeBalance(
      makeInput({
        health: { readiness: 95, recovery: 90, previousReadiness: 95 },
        journal: { entriesThisWeek: 4, lastReviewDaysAgo: 3, growthScore: 20 },
      }),
    );
    expect(balance.strongest).toBe("health");
    expect(balance.imbalanced).toBe(true);
  });

  it("partitions rising and falling areas", () => {
    const input = makeInput({
      health: { readiness: 90, recovery: 74, previousReadiness: 70 }, // rising
      analytics: {
        ...makeInput().analytics,
        finance: 40,
        previous: { ...makeInput().analytics.previous!, finance: 60 },
      }, // falling
    });
    const areas = lifeAreas(input);
    expect(improvingAreas(areas).some((a) => a.area === "health")).toBe(true);
    expect(decliningAreas(areas).some((a) => a.area === "finance")).toBe(true);
  });
});

describe("wheel of life — pure re-projection", () => {
  it("lifts area scores into radar slices", () => {
    const balance = lifeBalance(makeInput());
    const slices = wheelOfLife(balance.areas);
    expect(slices).toHaveLength(8);
    expect(slices[0]).toHaveProperty("value");
  });

  it("fullness is the average spoke", () => {
    const slices = wheelOfLife(lifeAreas(makeInput()));
    const full = wheelFullness(slices);
    expect(full).toBeGreaterThan(0);
    expect(full).toBeLessThanOrEqual(100);
    expect(wheelFullness([])).toBe(0);
  });
});
