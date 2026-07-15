import { describe, expect, it } from "vitest";
import { at, makeReflection } from "./fixtures";
import {
  completeReflection,
  createReflection,
  isComplete,
  latestReflection,
  outstandingLesson,
  reflectionForDate,
} from "./reflections";

const now = new Date(at(2026, 6, 7, 22));

describe("reflections", () => {
  it("creates a reflection trimming inputs", () => {
    const r = createReflection(
      { date: "2026-07-07", reflection: "  good day  ", wins: [" win ", ""] },
      now,
    );
    expect(r.reflection).toBe("good day");
    expect(r.wins).toEqual(["win"]);
    expect(r.completedAt).toBeNull();
  });

  it("completes a reflection", () => {
    expect(completeReflection(makeReflection(), now).completedAt).toBe(now.toISOString());
  });

  it("treats a reflection with prose + wins as complete", () => {
    expect(isComplete(makeReflection())).toBe(true);
    expect(isComplete(makeReflection({ reflection: "", wins: [], lessons: [] }))).toBe(false);
  });

  it("finds the latest reflection by date", () => {
    const list = [
      makeReflection({ id: "a", date: "2026-07-05" }),
      makeReflection({ id: "b", date: "2026-07-07" }),
    ];
    expect(latestReflection(list)?.id).toBe("b");
    expect(latestReflection([])).toBeNull();
  });

  it("finds a reflection for a date", () => {
    const list = [makeReflection({ date: "2026-07-07" })];
    expect(reflectionForDate(list, "2026-07-07")).not.toBeNull();
    expect(reflectionForDate(list, "2026-07-08")).toBeNull();
  });

  it("surfaces the most recent outstanding lesson", () => {
    const list = [
      makeReflection({ id: "a", date: "2026-07-05", lessons: ["Sleep more"] }),
      makeReflection({ id: "b", date: "2026-07-07", lessons: ["Ship smaller"] }),
    ];
    expect(outstandingLesson(list)).toBe("Ship smaller");
  });

  it("returns null lesson when none recorded", () => {
    expect(outstandingLesson([makeReflection({ lessons: [] })])).toBeNull();
  });
});
