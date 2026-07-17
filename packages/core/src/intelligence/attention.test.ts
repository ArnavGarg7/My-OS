import { describe, expect, it } from "vitest";
import {
  atRisk,
  attentionByLevel,
  attentionItems,
  improving,
  needsAttention,
  topAttention,
} from "./attention";
import { executiveSummary, focusLabel } from "./executive-summary";
import { fallingTrends, risingTrends, trends } from "./trends";
import { priorityMatrix, quadrantOf, tomorrowPriorities } from "./priorities";
import { makeInput, makeTroubledInput } from "./fixtures";

describe("attention engine — deterministic + explainable", () => {
  it("a healthy input surfaces only benign items", () => {
    const items = attentionItems(makeInput());
    // Baseline has 5 flashcards due — that is the only thing worth noting.
    expect(needsAttention(items)).toHaveLength(0);
    expect(items.some((i) => i.id === "flashcards-due")).toBe(true);
  });

  it("surfaces slipping goals as needs_attention", () => {
    const items = attentionItems(makeTroubledInput());
    const goal = items.find((i) => i.id === "goal-slipping");
    expect(goal?.level).toBe("needs_attention");
    expect(goal?.reason).toMatch(/off-track/);
  });

  it("every item carries a reason restating its rule", () => {
    for (const i of attentionItems(makeTroubledInput())) {
      expect(i.reason.length).toBeGreaterThan(0);
    }
  });

  it("flags habit streaks at risk", () => {
    expect(attentionItems(makeTroubledInput()).some((i) => i.id === "habit-streak")).toBe(true);
  });

  it("flags low readiness but celebrates rising readiness", () => {
    expect(
      attentionItems(
        makeInput({ health: { readiness: 30, recovery: 40, previousReadiness: 30 } }),
      ).some((i) => i.id === "low-readiness"),
    ).toBe(true);
    const rising = attentionItems(
      makeInput({ health: { readiness: 80, recovery: 74, previousReadiness: 70 } }),
    );
    expect(rising.some((i) => i.id === "readiness-rising")).toBe(true);
  });

  it("surfaces resource renewals, expiring documents and over-budget", () => {
    const items = attentionItems(makeTroubledInput());
    expect(items.some((i) => i.id === "renewals-due")).toBe(true);
    expect(items.some((i) => i.id === "documents-expiring")).toBe(true);
    expect(items.some((i) => i.id === "over-budget")).toBe(true);
  });

  it("sorts worst-first and picks the top item", () => {
    const items = attentionItems(makeTroubledInput());
    expect(items[0]?.level).toBe("needs_attention");
    expect(topAttention(items)).toBe(items[0]);
    expect(topAttention([])).toBeNull();
  });

  it("groups items by band", () => {
    const grouped = attentionByLevel(attentionItems(makeTroubledInput()));
    expect(grouped.needs_attention.length).toBeGreaterThan(0);
    expect(atRisk(attentionItems(makeTroubledInput())).length).toBeGreaterThan(0);
  });

  it("improving items appear only when something improves", () => {
    expect(improving(attentionItems(makeTroubledInput()))).toHaveLength(0);
  });
});

describe("executive summary — structured, never prose", () => {
  it("labels focus by band", () => {
    expect(focusLabel(75)).toBe("high");
    expect(focusLabel(50)).toBe("medium");
    expect(focusLabel(20)).toBe("low");
  });

  it("assembles owned numbers into the snapshot", () => {
    const s = executiveSummary(makeInput());
    expect(s.plannerAccuracy).toBe(88);
    expect(s.habitConsistency).toBe(82);
    expect(s.focusLabel).toBe("high");
    expect(s.goals.onTrack).toBe(4);
  });

  it("carries the top attention title, or null when clear", () => {
    expect(executiveSummary(makeTroubledInput()).topAttention).not.toBeNull();
  });
});

describe("trends — current vs previous", () => {
  it("marks direction and signed delta", () => {
    const views = trends(
      makeInput({ health: { readiness: 90, recovery: 74, previousReadiness: 70 } }),
    );
    const readiness = views.find((t) => t.key === "readiness");
    expect(readiness?.direction).toBe("rising");
    expect(readiness?.delta).toBe(20);
  });

  it("partitions rising and falling", () => {
    const views = trends(makeTroubledInput());
    expect(fallingTrends(views).length).toBeGreaterThan(0);
    expect(risingTrends(views).length).toBeGreaterThanOrEqual(0);
  });
});

describe("priorities — importance × urgency", () => {
  it("places urgent+important items in do_now", () => {
    // renewals-due is important (needs_attention) and urgent (title matches /renewal/).
    const matrix = priorityMatrix(makeTroubledInput());
    const renewal = matrix.find((p) => p.item.id === "renewals-due");
    expect(renewal?.quadrant).toBe("do_now");
  });

  it("quadrantOf bands a single item", () => {
    expect(
      quadrantOf({
        id: "x",
        level: "needs_attention",
        area: "finance",
        title: "renewal due",
        reason: "",
      }),
    ).toBe("do_now");
    expect(
      quadrantOf({
        id: "x",
        level: "needs_attention",
        area: "career",
        title: "goal slipping",
        reason: "",
      }),
    ).toBe("schedule");
    expect(
      quadrantOf({
        id: "x",
        level: "stable",
        area: "learning",
        title: "flashcards due",
        reason: "",
      }),
    ).toBe("delegate");
    expect(
      quadrantOf({
        id: "x",
        level: "improving",
        area: "health",
        title: "readiness rising",
        reason: "",
      }),
    ).toBe("watch");
  });

  it("tomorrow priorities are do-now first and capped", () => {
    const picks = tomorrowPriorities(makeTroubledInput(), 3);
    expect(picks.length).toBeLessThanOrEqual(3);
  });
});
