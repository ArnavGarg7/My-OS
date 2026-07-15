import { describe, expect, it } from "vitest";
import { collectCarryForward } from "./carryforward";
import { computeReadiness } from "./readiness";
import { tomorrowSignals } from "./decisions";
import { makeCarryForward, makeReadinessInput } from "./fixtures";
import type { CarryForwardCandidate } from "./types";

describe("tomorrowSignals", () => {
  it("flags nothing on a balanced day", () => {
    const s = tomorrowSignals(
      collectCarryForward(makeCarryForward()),
      computeReadiness(
        makeReadinessInput({
          healthReadiness: 85,
          meetingMinutes: 120,
          expectedWorkloadMinutes: 120,
        }),
      ),
      3,
    );
    expect(s.tooMuchUnfinished).toBe(false);
    expect(s.heavyMeetingDay).toBe(false);
    expect(s.lowReadiness).toBe(false);
    expect(s.priorityCount).toBe(3);
  });
  it("flags too much unfinished work", () => {
    const many: CarryForwardCandidate[] = Array.from({ length: 10 }, (_, i) => ({
      id: `x${i}`,
      kind: "task",
      title: `Task ${i}`,
      reason: "Overdue",
      entityId: `t${i}`,
    }));
    const s = tomorrowSignals(collectCarryForward(many), computeReadiness(makeReadinessInput()), 3);
    expect(s.tooMuchUnfinished).toBe(true);
    expect(s.carryForwardCount).toBe(10);
  });
  it("flags a heavy meeting day", () => {
    const s = tomorrowSignals(
      collectCarryForward([]),
      computeReadiness(makeReadinessInput({ meetingMinutes: 200 })),
      2,
    );
    expect(s.heavyMeetingDay).toBe(true);
  });
  it("flags low readiness", () => {
    const s = tomorrowSignals(
      collectCarryForward([]),
      computeReadiness(
        makeReadinessInput({
          healthReadiness: 40,
          meetingMinutes: 240,
          expectedWorkloadMinutes: 240,
        }),
      ),
      2,
    );
    expect(s.lowReadiness).toBe(true);
  });
  it("carries the carry-forward count", () => {
    const s = tomorrowSignals(
      collectCarryForward(makeCarryForward()),
      computeReadiness(makeReadinessInput()),
      3,
    );
    expect(s.carryForwardCount).toBe(5);
  });
  it("is not overloaded exactly at the threshold", () => {
    const eight = Array.from({ length: 8 }, (_, i) => ({
      id: `x${i}`,
      kind: "task" as const,
      title: `T${i}`,
      reason: "Overdue",
      entityId: `t${i}`,
    }));
    const s = tomorrowSignals(
      collectCarryForward(eight),
      computeReadiness(makeReadinessInput()),
      3,
    );
    expect(s.tooMuchUnfinished).toBe(false);
  });
});
