import { describe, expect, it } from "vitest";
import { tomorrowEngine } from "./engine";
import { makeContext } from "./fixtures";

describe("TomorrowEngine.run", () => {
  const state = tomorrowEngine.run(makeContext(), "review");

  it("assembles every workflow piece", () => {
    expect(state.review.completionScore).toBeGreaterThan(0);
    expect(state.carryForward.total).toBe(5);
    expect(state.priorities.top).toHaveLength(3);
    expect(state.calendar.meetingMinutes).toBe(150);
    expect(state.readiness.score).toBeGreaterThanOrEqual(0);
    expect(state.checklist.total).toBeGreaterThan(0);
    expect(state.recommendations.length).toBeGreaterThan(0);
  });

  it("cannot finalise until required checklist items are done", () => {
    expect(state.canFinalize).toBe(false);
  });

  it("finalises once priorities + required checklist are satisfied", () => {
    const ctx = makeContext();
    const checklist = [
      { id: "c1", item: "Review inbox", completed: true, required: true },
      { id: "c2", item: "Set priorities", completed: true, required: true },
    ];
    const ready = tomorrowEngine.run({ ...ctx, checklist }, "finalize");
    expect(ready.canFinalize).toBe(true);
    expect(ready.progress).toBe(100);
  });

  it("summarises for the status bar / context panel", () => {
    const summary = tomorrowEngine.summarize(state, "draft", "review", 4);
    expect(summary.priorityCount).toBe(3);
    expect(summary.carryForwardCount).toBe(5);
    expect(summary.plannerBlockCount).toBe(4);
    expect(summary.status).toBe("draft");
  });

  it("exposes signals for the Decision engine", () => {
    const signals = tomorrowEngine.signals(makeContext());
    expect(typeof signals.heavyMeetingDay).toBe("boolean");
    expect(signals.priorityCount).toBe(3);
  });

  it("reflects the current step in progress", () => {
    expect(tomorrowEngine.run(makeContext(), "review").progress).toBe(0);
    expect(tomorrowEngine.run(makeContext(), "checklist").progress).toBeGreaterThan(0);
  });

  it("produces recommendations tied to the day", () => {
    const overloaded = tomorrowEngine.run(
      makeContext({
        carryForwardCandidates: Array.from({ length: 10 }, (_, i) => ({
          id: `x${i}`,
          kind: "task" as const,
          title: `T${i}`,
          reason: "Overdue",
          entityId: `t${i}`,
        })),
      }),
      "finalize",
    );
    expect(overloaded.recommendations.some((r) => r.id === "reduce-workload")).toBe(true);
    expect(overloaded.signals.tooMuchUnfinished).toBe(true);
  });

  it("merges the calendar into the state", () => {
    expect(state.calendar.meetingCount).toBe(3);
    expect(state.calendar.freeWindows.length).toBeGreaterThan(0);
  });

  it("ranks priorities into the state", () => {
    expect(state.priorities.ranked[0]!.rank).toBe(1);
  });
});
