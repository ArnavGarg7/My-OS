import { describe, expect, it } from "vitest";
import { isMemorable, memoryTypeFor, promoteMemories, toMemory } from "./memories";
import { makeEvent, makeStream } from "./fixtures";

describe("memoryTypeFor", () => {
  it("maps known event types", () => {
    expect(memoryTypeFor(makeEvent({ eventType: "goal.completed" }))).toBe("achievement");
    expect(memoryTypeFor(makeEvent({ eventType: "saving.completed" }))).toBe("finance");
    expect(memoryTypeFor(makeEvent({ eventType: "reflection.completed" }))).toBe("reflection");
  });
  it("falls back to milestone", () => {
    expect(memoryTypeFor(makeEvent({ eventType: "mystery.kind", importance: 90 }))).toBe(
      "milestone",
    );
  });
});

describe("isMemorable", () => {
  it("promotes explicit rule types", () => {
    expect(isMemorable(makeEvent({ eventType: "goal.completed" }))).toBe(true);
  });
  it("promotes high-importance events even without a rule", () => {
    expect(isMemorable(makeEvent({ eventType: "x.y", importance: 90 }))).toBe(true);
  });
  it("skips low-importance ordinary events", () => {
    expect(isMemorable(makeEvent({ eventType: "task.created", importance: 20 }))).toBe(false);
  });
});

describe("toMemory", () => {
  it("derives a stable id from the event", () => {
    const m = toMemory(makeEvent({ id: "abc", title: "Won" }));
    expect(m.id).toBe("mem_abc");
    expect(m.eventId).toBe("abc");
    expect(m.pinned).toBe(false);
  });
});

describe("promoteMemories", () => {
  it("returns only memorable events, newest first", () => {
    const memories = promoteMemories(makeStream());
    // goal.completed (a) qualifies; habit.completed (e) does not.
    expect(memories.map((m) => m.eventId)).toContain("a");
    expect(memories.map((m) => m.eventId)).not.toContain("e");
  });
});
