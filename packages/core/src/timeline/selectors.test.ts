import { describe, expect, it } from "vitest";
import { byId, latest, neighbors, relatedTo, statistics } from "./selectors";
import { makeEvent, makeStream } from "./fixtures";

describe("latest / byId", () => {
  it("returns the newest N", () => {
    expect(latest(makeStream(), 2).map((e) => e.id)).toEqual(["b", "a"]);
  });
  it("looks up by id", () => {
    expect(byId(makeStream(), "c")?.title).toBe("Morning pages");
    expect(byId(makeStream(), "nope")).toBeNull();
  });
});

describe("neighbors", () => {
  it("returns the surrounding events in the stream", () => {
    // newest-first order: b, a, d, c, e
    const { previous, next } = neighbors(makeStream(), "a");
    expect(previous?.id).toBe("b");
    expect(next?.id).toBe("d");
  });
  it("handles missing ids", () => {
    expect(neighbors(makeStream(), "x")).toEqual({ previous: null, next: null });
  });
});

describe("relatedTo", () => {
  it("finds events sharing an entity id", () => {
    const events = [
      makeEvent({ id: "1", entityId: "g1", title: "Created" }),
      makeEvent({ id: "2", entityId: "g1", title: "Completed" }),
      makeEvent({ id: "3", entityId: "g2", title: "Other" }),
    ];
    const related = relatedTo(events, events[0]!);
    expect(related.map((e) => e.id)).toEqual(["2"]);
  });
  it("returns nothing when the event has no entity", () => {
    expect(relatedTo(makeStream(), makeEvent({ id: "z", entityId: null }))).toEqual([]);
  });
});

describe("statistics", () => {
  it("aggregates totals, sources, active days + span", () => {
    const stats = statistics(makeStream());
    expect(stats.totalEvents).toBe(5);
    expect(stats.bySource.goal).toBe(2);
    expect(stats.activeDays).toBe(3);
    expect(stats.busiestDay?.count).toBe(2);
    expect(stats.firstAt).not.toBeNull();
    expect(stats.lastAt).not.toBeNull();
  });
});
