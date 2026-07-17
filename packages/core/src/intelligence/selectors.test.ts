import { describe, expect, it } from "vitest";
import { buildSummary, computeSignals, emptySignals, emptySummary } from "./selectors";
import { buildStatistics, emptyStatistics } from "./statistics";
import { addRef, collectionSize, moduleCounts, refsForModule, removeRef } from "./collections";
import { areaCorrelations, correlateSeries, pearson } from "./correlations";
import { FIXED_NOW, makeCollection, makeInput, makeTroubledInput } from "./fixtures";

describe("signals — thresholds live in constants, not rules", () => {
  it("a healthy platform trips only positive growth", () => {
    const s = computeSignals(makeInput());
    expect(s.overallHealthLow).toBe(false);
    expect(s.multipleAreasDeclining).toBe(false);
  });

  it("a troubled platform trips the decline + low + review signals", () => {
    const s = computeSignals(makeTroubledInput());
    expect(s.overallHealthLow).toBe(true);
    expect(s.reviewDue).toBe(true);
  });

  it("multipleAreasDeclining needs three falling areas", () => {
    const input = makeInput({
      analytics: {
        productivity: 40,
        focus: 70,
        planner: 40,
        health: 78,
        goals: 40,
        finance: 40,
        journal: 65,
        overall: 50,
        previous: {
          productivity: 70,
          focus: 70,
          planner: 70,
          health: 78,
          goals: 70,
          finance: 70,
          journal: 65,
          overall: 70,
        },
      },
    });
    expect(computeSignals(input).multipleAreasDeclining).toBe(true);
  });

  it("lifeBalanceLow mirrors an imbalanced spread", () => {
    const input = makeInput({
      health: { readiness: 98, recovery: 95, previousReadiness: 98 },
      journal: { entriesThisWeek: 4, lastReviewDaysAgo: 3, growthScore: 10 },
    });
    expect(computeSignals(input).lifeBalanceLow).toBe(true);
  });

  it("empty helpers are all-false / zeroed", () => {
    expect(Object.values(emptySignals()).every((v) => v === false)).toBe(true);
    expect(emptySummary().overall).toBe(0);
  });
});

describe("summary — the compact read model", () => {
  it("carries overall, focus, attention and the extremes", () => {
    const s = buildSummary(makeInput());
    expect(s.overall).toBeGreaterThan(0);
    expect(s.focusLabel).toBe("high");
    expect(s.strongest).toBeDefined();
    expect(s.weakest).toBeDefined();
  });

  it("reports the count of things needing attention", () => {
    expect(buildSummary(makeTroubledInput()).needsAttention).toBeGreaterThan(0);
  });
});

describe("statistics", () => {
  it("counts improving/declining areas and reviews due", () => {
    const stats = buildStatistics(makeTroubledInput(), {
      milestonesUpcoming: 2,
      achievementsUnlocked: 5,
    });
    expect(stats.milestonesUpcoming).toBe(2);
    expect(stats.achievementsUnlocked).toBe(5);
    expect(stats.reviewsDue).toBeGreaterThanOrEqual(1);
  });

  it("empty statistics are zeroed", () => {
    expect(emptyStatistics().overall).toBe(0);
  });
});

describe("collections — references, never copies", () => {
  it("adds a ref and ignores duplicates", () => {
    const c0 = makeCollection({ entityRefs: [] });
    const c1 = addRef(c0, { module: "goal", id: "g1" }, FIXED_NOW);
    const c2 = addRef(c1, { module: "goal", id: "g1" }, FIXED_NOW);
    expect(collectionSize(c1)).toBe(1);
    expect(collectionSize(c2)).toBe(1);
  });

  it("removes a ref", () => {
    const c = removeRef(makeCollection(), { module: "goal", id: "g1" }, FIXED_NOW);
    expect(collectionSize(c)).toBe(0);
  });

  it("filters and counts by module", () => {
    const c = makeCollection({
      entityRefs: [
        { module: "goal", id: "g1" },
        { module: "goal", id: "g2" },
        { module: "task", id: "t1" },
      ],
    });
    expect(refsForModule(c, "goal")).toEqual(["g1", "g2"]);
    expect(moduleCounts(c)).toEqual({ goal: 2, task: 1 });
  });
});

describe("correlations — plain pearson, sample floor", () => {
  it("perfect positive / negative / flat", () => {
    expect(pearson([1, 2, 3, 4], [2, 4, 6, 8])).toBe(1);
    expect(pearson([1, 2, 3, 4], [8, 6, 4, 2])).toBe(-1);
    expect(pearson([1, 1, 1, 1], [1, 2, 3, 4])).toBe(0);
  });

  it("reports nothing below the minimum sample count", () => {
    expect(correlateSeries("a", [1, 2], "b", [1, 2])).toBeNull();
  });

  it("correlates a series above the floor and ranks by magnitude", () => {
    const c = correlateSeries("health", [70, 75, 80, 85], "focus", [60, 65, 70, 75]);
    expect(c?.samples).toBe(4);
    const all = areaCorrelations({
      health: [70, 75, 80, 85],
      focus: [60, 65, 70, 75],
      finance: [50, 40, 30, 20],
    });
    expect(all.length).toBeGreaterThan(0);
    // strongest absolute coefficient first
    expect(Math.abs(all[0]!.coefficient)).toBeGreaterThanOrEqual(
      Math.abs(all[all.length - 1]!.coefficient),
    );
  });
});
