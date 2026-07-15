import { describe, expect, it } from "vitest";
import { timelineEngine } from "./engine";
import { day, makeStream } from "./fixtures";

describe("TimelineEngine", () => {
  const stream = makeStream();

  it("materializes an input into a canonical event", () => {
    const e = timelineEngine.materialize(
      { eventType: "goal.completed", source: "goal", title: "Won" },
      "id1",
    );
    expect(e.importance).toBe(100);
  });

  it("feeds newest-first and applies filters", () => {
    expect(timelineEngine.feed(stream)[0]!.id).toBe("b");
    expect(
      timelineEngine
        .feed(stream, { sources: ["goal"] })
        .map((e) => e.id)
        .sort(),
    ).toEqual(["a", "e"]);
  });

  it("groups the feed", () => {
    expect(timelineEngine.group(stream, "day")).toHaveLength(3);
  });

  it("returns a day view", () => {
    const view = timelineEngine.day(stream, day(2026, 6, 3));
    expect(view.day.eventCount).toBe(2);
    expect(view.events).toHaveLength(2);
  });

  it("promotes memories + computes highlights + snapshots + stats", () => {
    expect(timelineEngine.memories(stream).length).toBeGreaterThan(0);
    expect(timelineEngine.highlights(stream, day(2026, 6, 10)).length).toBeGreaterThan(0);
    expect(timelineEngine.snapshot(stream, "month", day(2026, 6, 3)).metadata.eventCount).toBe(5);
    expect(timelineEngine.snapshots(stream, day(2026, 6, 3))).toHaveLength(4);
    expect(timelineEngine.statistics(stream).totalEvents).toBe(5);
  });

  it("searches", () => {
    expect(timelineEngine.search(stream, "groceries").map((e) => e.id)).toEqual(["d"]);
  });
});
