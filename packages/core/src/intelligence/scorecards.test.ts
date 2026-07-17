import { describe, expect, it } from "vitest";
import {
  financeScorecard,
  growthScorecard,
  healthScorecard,
  learningScorecard,
  productivityScorecard,
  relationshipsScorecard,
  scorecards,
} from "./scorecards";
import { buildDashboard } from "./dashboard";
import { lifePortfolio } from "./portfolio";
import { makeInput, makeTroubledInput } from "./fixtures";

describe("scorecards — grouped owned metrics", () => {
  it("produces six cards", () => {
    expect(scorecards(makeInput())).toHaveLength(6);
  });

  it("productivity averages owned productivity/focus/planner/completion", () => {
    const card = productivityScorecard(makeInput());
    // (75 + 70 + 80 + 85) / 4 = 77.5 → 78
    expect(card.score).toBe(78);
    expect(card.metrics.find((m) => m.label === "Planner accuracy")?.value).toBe("88%");
  });

  it("health card restates readiness/recovery/consistency", () => {
    const card = healthScorecard(makeInput());
    expect(card.metrics.find((m) => m.label === "Readiness")?.value).toBe("78");
    expect(card.metrics.find((m) => m.label === "Best streak")?.value).toBe("21d");
  });

  it("learning card headlines the owned learning score", () => {
    expect(learningScorecard(makeInput()).score).toBe(70);
  });

  it("finance card formats net worth and budget flag", () => {
    const card = financeScorecard(makeTroubledInput());
    expect(card.metrics.find((m) => m.label === "Over budget")?.value).toBe("Yes");
    expect(card.metrics.find((m) => m.label === "Net worth")?.value).toMatch(/₹/);
  });

  it("relationships card bands strong vs dormant", () => {
    const card = relationshipsScorecard(makeInput());
    // 4 strong of 6 known → 66.7 → 67
    expect(card.score).toBe(67);
  });

  it("growth card averages journal growth + goal analytics", () => {
    const card = growthScorecard(makeInput());
    // (70 + 72) / 2 = 71
    expect(card.score).toBe(71);
  });

  it("every card carries a banded level", () => {
    for (const c of scorecards(makeInput())) {
      expect(["needs_attention", "at_risk", "stable", "improving", "excellent"]).toContain(c.level);
    }
  });
});

describe("dashboard composition", () => {
  it("fans out into every view", () => {
    const d = buildDashboard(makeInput());
    expect(d.summary).toBeDefined();
    expect(d.balance.areas).toHaveLength(8);
    expect(d.wheel).toHaveLength(8);
    expect(d.scorecards).toHaveLength(6);
    expect(d.trends.length).toBeGreaterThan(0);
    expect(d.attentionByLevel.needs_attention).toBeDefined();
  });

  it("a troubled input produces a lower overall than a healthy one", () => {
    expect(buildDashboard(makeTroubledInput()).balance.overall).toBeLessThan(
      buildDashboard(makeInput()).balance.overall,
    );
  });
});

describe("portfolio — the AI seam", () => {
  it("re-exposes the balance with a banded overall level", () => {
    const p = lifePortfolio(makeInput());
    expect(p.areas).toHaveLength(8);
    expect(p.overallLevel).toBeDefined();
  });
});
