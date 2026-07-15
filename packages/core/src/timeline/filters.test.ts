import { describe, expect, it } from "vitest";
import { byDateRange, byImportance, bySource, filterEvents } from "./filters";
import { day, makeStream } from "./fixtures";

describe("filterEvents", () => {
  const stream = makeStream();

  it("filters by source", () => {
    expect(
      bySource(stream, "goal")
        .map((e) => e.id)
        .sort(),
    ).toEqual(["a", "e"]);
  });

  it("filters by importance floor", () => {
    const high = byImportance(stream, 85);
    expect(high.map((e) => e.id)).toContain("a"); // goal.completed = 100
    expect(high.map((e) => e.id)).not.toContain("e"); // habit.completed = 30
  });

  it("filters by inclusive date range", () => {
    const range = byDateRange(stream, day(2026, 6, 2), day(2026, 6, 2));
    expect(range.map((e) => e.id).sort()).toEqual(["c", "d"]);
  });

  it("intersects multiple predicates", () => {
    const out = filterEvents(stream, { sources: ["goal"], minImportance: 85 });
    expect(out.map((e) => e.id)).toEqual(["a"]);
  });

  it("returns the full stream for an empty filter", () => {
    expect(filterEvents(stream, {})).toHaveLength(5);
  });

  it("filters by event type", () => {
    expect(filterEvents(stream, { eventTypes: ["journal.created"] }).map((e) => e.id)).toEqual([
      "c",
    ]);
  });

  it("keeps results newest-first", () => {
    const out = filterEvents(stream, {});
    expect(out[0]!.id).toBe("b");
  });

  it("treats an ISO `to` bound as an instant", () => {
    const out = filterEvents(stream, { to: "2026-07-01T12:00:00.000Z" });
    expect(out.map((e) => e.id)).toEqual(["e"]);
  });
});
