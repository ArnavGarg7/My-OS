import { describe, expect, it } from "vitest";
import { bucketFor, groupEvents, isoWeek } from "./grouping";
import { at, makeEvent, makeStream } from "./fixtures";

describe("bucketFor", () => {
  it("keys by day", () => {
    expect(bucketFor(at(2026, 6, 3, 14), "day").key).toBe("2026-07-03");
  });
  it("keys by hour", () => {
    expect(bucketFor(at(2026, 6, 3, 14), "hour").key).toBe("2026-07-03T14");
  });
  it("keys by month + year", () => {
    expect(bucketFor(at(2026, 6, 3), "month").key).toBe("2026-07");
    expect(bucketFor(at(2026, 6, 3), "year").key).toBe("2026");
  });
  it("keys by ISO week", () => {
    expect(bucketFor(at(2026, 6, 3), "week").key).toMatch(/^2026-W\d{2}$/);
  });
});

describe("isoWeek", () => {
  it("computes an ISO week number", () => {
    const { week } = isoWeek(new Date(Date.UTC(2026, 0, 1)));
    expect(week).toBeGreaterThanOrEqual(1);
    expect(week).toBeLessThanOrEqual(53);
  });
});

describe("groupEvents", () => {
  it("groups by day newest-first with counts", () => {
    const groups = groupEvents(makeStream(), "day");
    expect(groups.map((g) => g.key)).toEqual(["2026-07-03", "2026-07-02", "2026-07-01"]);
    expect(groups[0]!.count).toBe(2);
  });
  it("collapses a single month bucket", () => {
    const groups = groupEvents(makeStream(), "month");
    expect(groups).toHaveLength(1);
    expect(groups[0]!.count).toBe(5);
  });
  it("puts newest event first inside a bucket", () => {
    const events = [
      makeEvent({ id: "early", timestamp: at(2026, 6, 3, 9) }),
      makeEvent({ id: "late", timestamp: at(2026, 6, 3, 18) }),
    ];
    const [group] = groupEvents(events, "day");
    expect(group!.events[0]!.id).toBe("late");
  });
});
