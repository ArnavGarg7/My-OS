import { describe, expect, it } from "vitest";
import {
  daySchema,
  feedSchema,
  pinMemorySchema,
  recordEventSchema,
  searchSchema,
  snapshotSchema,
} from "./schemas";

describe("recordEventSchema", () => {
  it("accepts a minimal valid event", () => {
    const parsed = recordEventSchema.parse({
      eventType: "goal.completed",
      source: "goal",
      title: "Won",
    });
    expect(parsed.eventType).toBe("goal.completed");
  });
  it("accepts optional entity/summary/importance/metadata", () => {
    const parsed = recordEventSchema.parse({
      eventType: "task.completed",
      source: "task",
      title: "Done",
      entityId: "t1",
      summary: "Finished the task",
      importance: 60,
      metadata: { focusMinutes: 30 },
    });
    expect(parsed.entityId).toBe("t1");
    expect(parsed.importance).toBe(60);
  });
  it("rejects an unknown source", () => {
    expect(() => recordEventSchema.parse({ eventType: "x", source: "nope", title: "t" })).toThrow();
  });
  it("rejects a blank title", () => {
    expect(() => recordEventSchema.parse({ eventType: "x", source: "goal", title: "" })).toThrow();
  });
  it("rejects importance out of range", () => {
    expect(() =>
      recordEventSchema.parse({ eventType: "x", source: "goal", title: "t", importance: 200 }),
    ).toThrow();
  });
});

describe("feedSchema", () => {
  it("accepts an empty filter", () => {
    expect(feedSchema.parse({})).toEqual({});
  });
  it("accepts sources + grouping + limit", () => {
    const parsed = feedSchema.parse({ sources: ["goal", "task"], grouping: "day", limit: 20 });
    expect(parsed.grouping).toBe("day");
  });
  it("rejects a bad grouping", () => {
    expect(() => feedSchema.parse({ grouping: "decade" })).toThrow();
  });
});

describe("day / search / snapshot / pin schemas", () => {
  it("validates a YYYY-MM-DD day", () => {
    expect(daySchema.parse({ date: "2026-07-01" }).date).toBe("2026-07-01");
    expect(() => daySchema.parse({ date: "July 1" })).toThrow();
  });
  it("validates search", () => {
    expect(searchSchema.parse({ query: "hello" }).query).toBe("hello");
  });
  it("validates a snapshot type", () => {
    expect(snapshotSchema.parse({ snapshotType: "week" }).snapshotType).toBe("week");
    expect(() => snapshotSchema.parse({ snapshotType: "fortnight" })).toThrow();
  });
  it("validates pin", () => {
    expect(pinMemorySchema.parse({ eventId: "e1" }).eventId).toBe("e1");
  });
});
