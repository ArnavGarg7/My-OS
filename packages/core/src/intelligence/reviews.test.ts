import { describe, expect, it } from "vitest";
import { buildReviewSnapshot, reviewOverdue, reviewsDueCount } from "./reviews";
import { generateReport } from "./reports";
import {
  completedMilestones,
  milestones,
  overdueMilestones,
  statusOf,
  upcomingMilestones,
} from "./milestones";
import {
  ACHIEVEMENT_RULES,
  achievements,
  unlockedAchievements,
  unlockedCount,
} from "./achievements";
import { FIXED_NOW, makeAchievementInput, makeInput, makeMilestone } from "./fixtures";

describe("reviews — immutable snapshots", () => {
  it("captures overall, areas and attention at a point in time", () => {
    const snap = buildReviewSnapshot(makeInput(), "weekly", "2026-07-13", FIXED_NOW);
    expect(snap.period).toBe("weekly");
    expect(snap.areas).toHaveLength(8);
    expect(snap.createdAt).toBe(FIXED_NOW.toISOString());
    expect(snap.highlights.length).toBeGreaterThan(0);
  });

  it("highlights the strongest area and any slipping goals", () => {
    const snap = buildReviewSnapshot(
      makeInput({ goals: { onTrack: 2, slipping: 2, total: 4, velocity: -1 } }),
      "monthly",
      "2026-07-01",
      FIXED_NOW,
    );
    expect(snap.highlights.some((h) => h.includes("Strongest area"))).toBe(true);
    expect(snap.highlights.some((h) => h.includes("slipping"))).toBe(true);
  });

  it("reviewOverdue respects each cadence", () => {
    const input = makeInput({ reviewsDue: { weekly: 8, monthly: 5, quarterly: 10, yearly: 10 } });
    expect(reviewOverdue(input, "weekly")).toBe(true);
    expect(reviewOverdue(input, "monthly")).toBe(false);
  });

  it("a never-done review is overdue", () => {
    const input = makeInput({
      reviewsDue: { weekly: null, monthly: 5, quarterly: 10, yearly: 10 },
    });
    expect(reviewOverdue(input, "weekly")).toBe(true);
    expect(reviewsDueCount(input)).toBeGreaterThanOrEqual(1);
  });
});

describe("reports — formatting of a snapshot, no new data", () => {
  const snap = buildReviewSnapshot(makeInput(), "weekly", "2026-07-13", FIXED_NOW);

  it("renders Markdown with a heading, areas and highlights", () => {
    const report = generateReport(snap, "markdown", FIXED_NOW);
    expect(report.content).toContain("# Weekly Review");
    expect(report.content).toContain("## Life areas");
    expect(report.content).toMatch(/Overall life score/);
  });

  it("renders JSON that round-trips to the snapshot", () => {
    const report = generateReport(snap, "json", FIXED_NOW);
    expect(JSON.parse(report.content).overall).toBe(snap.overall);
  });

  it("stamps period + generatedAt", () => {
    const report = generateReport(snap, "markdown", FIXED_NOW);
    expect(report.period).toBe("weekly");
    expect(report.generatedAt).toBe(FIXED_NOW.toISOString());
  });
});

describe("milestones — status derived from the date", () => {
  it("bands upcoming, overdue and completed", () => {
    expect(statusOf(makeMilestone({ date: "2026-08-01" }), FIXED_NOW)).toBe("upcoming");
    expect(statusOf(makeMilestone({ date: "2026-01-01" }), FIXED_NOW)).toBe("overdue");
    expect(
      statusOf(
        makeMilestone({ date: "2026-01-01", completedAt: "2026-01-02T00:00:00.000Z" }),
        FIXED_NOW,
      ),
    ).toBe("completed");
  });

  it("sorts soonest-first with completed sunk to the bottom", () => {
    const views = milestones(
      [
        makeMilestone({ id: "a", date: "2026-09-01" }),
        makeMilestone({ id: "b", date: "2026-07-20" }),
        makeMilestone({ id: "c", date: "2026-01-01", completedAt: "2026-01-02T00:00:00.000Z" }),
      ],
      FIXED_NOW,
    );
    expect(views[0]?.id).toBe("b");
    expect(views[views.length - 1]?.id).toBe("c");
  });

  it("partitions upcoming / overdue / completed", () => {
    const views = milestones(
      [
        makeMilestone({ id: "up", date: "2026-08-01" }),
        makeMilestone({ id: "late", date: "2026-01-01" }),
        makeMilestone({ id: "done", date: "2026-01-01", completedAt: "2026-01-02T00:00:00.000Z" }),
      ],
      FIXED_NOW,
    );
    expect(upcomingMilestones(views).map((m) => m.id)).toEqual(["up"]);
    expect(overdueMilestones(views).map((m) => m.id)).toEqual(["late"]);
    expect(completedMilestones(views).map((m) => m.id)).toEqual(["done"]);
  });
});

describe("achievements — explicit rule table", () => {
  it("unlocks the ones whose thresholds are met", () => {
    const unlocked = unlockedAchievements(makeAchievementInput(), FIXED_NOW);
    // baseline: 40 workouts (no), 12 books (no), 45d streak (month-strong yes), 1 investment (yes),
    // 3 goals (first-goal yes), 6 reviews (no), 80 notes (no), 60h focus (no).
    expect(unlocked.some((a) => a.id === "streak-30")).toBe(true);
    expect(unlocked.some((a) => a.id === "first-investment")).toBe(true);
    expect(unlocked.some((a) => a.id === "first-goal")).toBe(true);
    expect(unlocked.some((a) => a.id === "workouts-100")).toBe(false);
  });

  it("returns every rule, unlocked or not", () => {
    expect(achievements(makeAchievementInput(), FIXED_NOW)).toHaveLength(ACHIEVEMENT_RULES.length);
  });

  it("counts unlocked", () => {
    expect(
      unlockedCount(makeAchievementInput({ workoutsTotal: 100, goalsCompleted: 10 })),
    ).toBeGreaterThan(unlockedCount(makeAchievementInput({ workoutsTotal: 0, goalsCompleted: 0 })));
  });

  it("stamps unlockedAt only on met rules", () => {
    const all = achievements(makeAchievementInput(), FIXED_NOW);
    const met = all.find((a) => a.id === "first-investment");
    const unmet = all.find((a) => a.id === "workouts-100");
    expect(met?.unlockedAt).toBe(FIXED_NOW.toISOString());
    expect(unmet?.unlockedAt).toBeNull();
  });
});
