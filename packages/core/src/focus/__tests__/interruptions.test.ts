import { describe, expect, it } from "vitest";
import {
  countByType,
  hasTooManyInterruptions,
  interruptionBreakdown,
  makeInterruption,
} from "../interruptions";
import { makeInterruptionFixture, makeSession } from "../fixtures";

const now = new Date("2026-07-11T09:15:00Z");

describe("interruptions", () => {
  it("makeInterruption stamps time and optional note", () => {
    const i = makeInterruption("i1", "phone", now, "boss called");
    expect(i.type).toBe("phone");
    expect(i.at).toBe(now.toISOString());
    expect(i.note).toBe("boss called");
  });

  it("omits note when not provided", () => {
    const i = makeInterruption("i1", "message", now);
    expect(i.note).toBeUndefined();
  });

  it("countByType filters by type", () => {
    const s = makeSession({
      interruptions: [
        makeInterruptionFixture({ id: "a", type: "phone" }),
        makeInterruptionFixture({ id: "b", type: "phone" }),
        makeInterruptionFixture({ id: "c", type: "message" }),
      ],
    });
    expect(countByType(s, "phone")).toBe(2);
    expect(countByType(s, "message")).toBe(1);
  });

  it("interruptionBreakdown zero-fills every type", () => {
    const s = makeSession({ interruptions: [makeInterruptionFixture({ type: "distraction" })] });
    const b = interruptionBreakdown(s);
    expect(b.distraction).toBe(1);
    expect(b.phone).toBe(0);
    expect(Object.keys(b)).toHaveLength(5);
  });

  it("hasTooManyInterruptions at the threshold", () => {
    const s = makeSession({
      interruptions: [1, 2, 3, 4].map((n) => makeInterruptionFixture({ id: `i${n}` })),
    });
    expect(hasTooManyInterruptions(s)).toBe(true);
    expect(hasTooManyInterruptions(makeSession({ interruptions: [] }))).toBe(false);
  });
});
