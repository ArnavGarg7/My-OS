import { describe, expect, it } from "vitest";
import { nowRecommendation } from "./recommendation";
import { makeContext, FIXED_NOW } from "./fixtures";

describe("Now Engine", () => {
  it("recommends deep focus on the top task when an uninterrupted window exists", () => {
    const r = nowRecommendation(makeContext());
    expect(r.action).toBe("start_focus");
    expect(r.ref).toEqual({ module: "task", id: "t1" });
    expect(r.explanation.situation.length).toBeGreaterThan(0);
    expect(r.explanation.costOfIgnoring.length).toBeGreaterThan(0);
    expect(r.alternatives.length).toBeGreaterThan(0);
  });

  it("is deterministic — same context yields the same recommendation", () => {
    expect(nowRecommendation(makeContext())).toEqual(nowRecommendation(makeContext()));
  });

  it("recommends a break when an active session is past the break cadence", () => {
    const r = nowRecommendation(
      makeContext({
        activeFocusSession: { startedAt: "2026-07-18T09:00:00.000Z", plannedMinutes: 90 },
      }),
    );
    expect(r.action).toBe("take_break");
  });

  it("recommends staying focused mid-session before the cadence", () => {
    const r = nowRecommendation(
      makeContext({
        activeFocusSession: { startedAt: "2026-07-18T09:40:00.000Z", plannedMinutes: 90 },
      }),
    );
    expect(r.action).toBe("start_focus");
    expect(r.title).toBe("Stay focused");
  });

  it("recommends a rescue when the plan is disrupted", () => {
    const r = nowRecommendation(
      makeContext({ disruptions: [{ kind: "missed_block", detail: "missed Algorithms" }] }),
    );
    expect(r.action).toBe("reschedule");
  });

  it("recommends the active plan block when one covers now", () => {
    const r = nowRecommendation(
      makeContext({
        planBlocks: [
          {
            id: "b1",
            title: "Deep work",
            start: "2026-07-18T09:30:00.000Z",
            end: "2026-07-18T11:00:00.000Z",
            type: "deep_work",
            status: "active",
            locked: false,
            taskId: "t1",
          },
        ],
      }),
    );
    expect(r.action).toBe("start_block");
    expect(r.ref).toEqual({ module: "planner", id: "b1" });
  });

  it("recommends planning when there are blocks-less days", () => {
    const r = nowRecommendation(makeContext({ tasks: [], focusWindows: [], planBlocks: [] }));
    expect(r.action).toBe("plan");
  });

  it("reviews pending decisions when no work fits", () => {
    const r = nowRecommendation(
      makeContext({
        tasks: [],
        focusWindows: [],
        planBlocks: [
          {
            id: "b",
            title: "x",
            start: FIXED_NOW,
            end: FIXED_NOW,
            type: "break",
            status: "done",
            locked: false,
          },
        ],
        pendingDecisions: 2,
      }),
    );
    expect(r.action).toBe("review");
  });
});
