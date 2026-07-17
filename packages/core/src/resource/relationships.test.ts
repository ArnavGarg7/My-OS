import { describe, expect, it } from "vitest";
import {
  coldRelationships,
  daysSinceContact,
  dormantRelationships,
  engagementScore,
  followUpDue,
  followUpsDue,
  healthOf,
  healthReport,
  lastInteraction,
  recentCount,
  strengthOf,
  strongRelationships,
} from "./relationships";
import { FIXED_NOW, interactionSeries, makeInteraction, makeRelationship } from "./fixtures";

describe("relationships — recency", () => {
  it("finds the most recent interaction regardless of array order", () => {
    const list = [
      makeInteraction({ id: "old", occurredAt: "2026-01-01T09:00:00.000Z" }),
      makeInteraction({ id: "new", occurredAt: "2026-07-01T09:00:00.000Z" }),
    ];
    expect(lastInteraction(list)?.id).toBe("new");
  });

  it("counts days since the last contact", () => {
    const list = [makeInteraction({ occurredAt: "2026-07-06T10:00:00.000Z" })];
    expect(daysSinceContact(list, FIXED_NOW)).toBe(10);
  });

  it("returns null when there is no history at all", () => {
    expect(daysSinceContact([], FIXED_NOW)).toBeNull();
    expect(lastInteraction([])).toBeNull();
  });

  it("counts only interactions inside the 90-day strength window", () => {
    const recent = interactionSeries("rel-1", 3, 7, 0); // 0, 7, 14 days ago
    const ancient = [makeInteraction({ id: "old", occurredAt: "2025-01-01T09:00:00.000Z" })];
    expect(recentCount([...recent, ...ancient], FIXED_NOW)).toBe(3);
  });
});

describe("relationships — strength bands", () => {
  it("is strong with frequent, recent contact", () => {
    // 4 interactions, most recent today, all inside 30 days.
    const list = interactionSeries("rel-1", 4, 7, 0);
    expect(strengthOf(list, FIXED_NOW)).toBe("strong");
  });

  it("is active when recent but infrequent", () => {
    const list = interactionSeries("rel-1", 1, 7, 5);
    expect(strengthOf(list, FIXED_NOW)).toBe("active");
  });

  it("recency gates the ceiling — frequent-but-stale is only cooling", () => {
    // 6 interactions, but the newest is 100 days ago: past the cold threshold.
    const list = interactionSeries("rel-1", 6, 3, 100);
    expect(recentCount(list, FIXED_NOW)).toBe(0);
    expect(strengthOf(list, FIXED_NOW)).toBe("cooling");
  });

  it("is dormant past 180 days", () => {
    const list = interactionSeries("rel-1", 2, 3, 200);
    expect(strengthOf(list, FIXED_NOW)).toBe("dormant");
  });

  it("is dormant with no contact ever", () => {
    expect(strengthOf([], FIXED_NOW)).toBe("dormant");
  });
});

describe("relationships — engagement score", () => {
  it("is 0 with no history", () => {
    expect(engagementScore([], FIXED_NOW)).toBe(0);
  });

  it("is highest for frequent contact today", () => {
    const list = interactionSeries("rel-1", 4, 5, 0);
    expect(engagementScore(list, FIXED_NOW)).toBe(100);
  });

  it("decays as contact recedes", () => {
    const fresh = interactionSeries("rel-1", 1, 7, 1);
    const stale = interactionSeries("rel-1", 1, 7, 120);
    expect(engagementScore(fresh, FIXED_NOW)).toBeGreaterThan(engagementScore(stale, FIXED_NOW));
  });

  it("stays within 0..100", () => {
    const many = interactionSeries("rel-1", 30, 1, 0);
    const score = engagementScore(many, FIXED_NOW);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });
});

describe("relationships — follow-ups", () => {
  it("is due when the date has arrived or passed", () => {
    expect(followUpDue(makeRelationship({ nextFollowUpAt: "2026-07-16" }), FIXED_NOW)).toBe(true);
    expect(followUpDue(makeRelationship({ nextFollowUpAt: "2026-07-01" }), FIXED_NOW)).toBe(true);
  });

  it("is not due in the future, nor when unset", () => {
    expect(followUpDue(makeRelationship({ nextFollowUpAt: "2026-08-01" }), FIXED_NOW)).toBe(false);
    expect(followUpDue(makeRelationship({ nextFollowUpAt: null }), FIXED_NOW)).toBe(false);
  });
});

describe("relationships — health report", () => {
  it("scopes interactions to the right person", () => {
    const r = makeRelationship({ id: "rel-1" });
    const interactions = [
      ...interactionSeries("rel-1", 2, 7, 0),
      ...interactionSeries("rel-2", 5, 7, 0),
    ];
    expect(healthOf(r, interactions, FIXED_NOW).interactionCount).toBe(2);
  });

  it("excludes archived people and sorts weakest first", () => {
    const relationships = [
      makeRelationship({ id: "rel-1", name: "Strong" }),
      makeRelationship({ id: "rel-2", name: "Quiet" }),
      makeRelationship({ id: "rel-3", name: "Gone", archived: true }),
    ];
    const interactions = interactionSeries("rel-1", 4, 5, 0);
    const report = healthReport(relationships, interactions, FIXED_NOW);
    expect(report).toHaveLength(2);
    expect(report[0]?.name).toBe("Quiet");
  });

  it("partitions into strong / dormant / cold", () => {
    const relationships = [makeRelationship({ id: "rel-1" }), makeRelationship({ id: "rel-2" })];
    const interactions = interactionSeries("rel-1", 4, 5, 0);
    const report = healthReport(relationships, interactions, FIXED_NOW);
    expect(strongRelationships(report).map((h) => h.relationshipId)).toEqual(["rel-1"]);
    expect(dormantRelationships(report).map((h) => h.relationshipId)).toEqual(["rel-2"]);
    expect(coldRelationships(report)).toHaveLength(1);
  });

  it("collects due follow-ups", () => {
    const relationships = [
      makeRelationship({ id: "rel-1", nextFollowUpAt: "2026-07-01" }),
      makeRelationship({ id: "rel-2", nextFollowUpAt: "2026-12-01" }),
    ];
    const report = healthReport(relationships, [], FIXED_NOW);
    expect(followUpsDue(report).map((h) => h.relationshipId)).toEqual(["rel-1"]);
  });
});
