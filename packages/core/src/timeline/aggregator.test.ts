import { describe, expect, it } from "vitest";
import {
  aggregate,
  buildDays,
  chronological,
  computeDay,
  countBySource,
  importanceFor,
  toEvent,
} from "./aggregator";
import { at, day, makeEvent, makeStream } from "./fixtures";

describe("importanceFor", () => {
  it("uses the event-type table and default fallback", () => {
    expect(importanceFor("goal.completed")).toBe(100);
    expect(importanceFor("unknown.kind")).toBe(40);
  });
  it("honours + clamps an override", () => {
    expect(importanceFor("task.completed", 90)).toBe(90);
    expect(importanceFor("task.completed", 250)).toBe(100);
    expect(importanceFor("task.completed", -5)).toBe(0);
  });
});

describe("toEvent", () => {
  it("derives summary + importance + defaults", () => {
    const e = toEvent({ eventType: "goal.completed", source: "goal", title: "Done" }, "id1");
    expect(e.id).toBe("id1");
    expect(e.summary).toBe("Done");
    expect(e.importance).toBe(100);
    expect(e.entityId).toBeNull();
    expect(e.metadata).toEqual({});
  });
});

describe("aggregate", () => {
  it("sorts newest-first and de-duplicates by id", () => {
    const events = [
      makeEvent({ id: "x", timestamp: at(2026, 6, 1) }),
      makeEvent({ id: "y", timestamp: at(2026, 6, 3) }),
      makeEvent({ id: "x", timestamp: at(2026, 6, 1) }),
    ];
    const out = aggregate(events);
    expect(out.map((e) => e.id)).toEqual(["y", "x"]);
  });
  it("breaks timestamp ties deterministically by id", () => {
    const a = makeEvent({ id: "a", timestamp: at(2026, 6, 1) });
    const b = makeEvent({ id: "b", timestamp: at(2026, 6, 1) });
    expect(aggregate([a, b]).map((e) => e.id)).toEqual(["b", "a"]);
  });
});

describe("chronological", () => {
  it("is oldest-first", () => {
    const out = chronological(makeStream());
    expect(out[0]!.id).toBe("e");
    expect(out[out.length - 1]!.id).toBe("b");
  });
});

describe("computeDay", () => {
  it("aggregates counts, completion, focus + journal flag", () => {
    const events = [
      makeEvent({
        eventType: "task.completed",
        timestamp: at(2026, 6, 3, 9),
        metadata: { focusMinutes: 50 },
      }),
      makeEvent({ eventType: "task.created", timestamp: at(2026, 6, 3, 10) }),
      makeEvent({ eventType: "journal.created", source: "journal", timestamp: at(2026, 6, 3, 8) }),
    ];
    const d = computeDay(events, day(2026, 6, 3));
    expect(d.eventCount).toBe(3);
    expect(d.completionScore).toBe(50); // 1 completed / (1 completed + 1 created)
    expect(d.focusMinutes).toBe(50);
    expect(d.journalWritten).toBe(true);
  });
  it("is zero for a day with no events", () => {
    const d = computeDay(makeStream(), day(2020, 0, 1));
    expect(d.eventCount).toBe(0);
    expect(d.completionScore).toBe(0);
    expect(d.journalWritten).toBe(false);
  });
});

describe("buildDays", () => {
  it("returns non-empty days newest-first", () => {
    const days = buildDays(makeStream());
    expect(days.map((d) => d.date)).toEqual([day(2026, 6, 3), day(2026, 6, 2), day(2026, 6, 1)]);
  });
});

describe("countBySource", () => {
  it("tallies per source", () => {
    const counts = countBySource(makeStream());
    expect(counts.goal).toBe(2);
    expect(counts.task).toBe(1);
    expect(counts.finance).toBe(1);
  });
});
