import { describe, expect, it } from "vitest";
import {
  averageAdherence,
  completionQuality,
  isPR,
  materializeRoutine,
  materializeRoutines,
  nextRoutine,
  personalRecords,
  routineAdherence,
  scheduleRoutine,
  sessionLoad,
  sessionVolume,
  sessionsThisWeek,
  setVolume,
  skippedRoutines,
  totalDuration,
  trainingLoad,
} from "../index";
import { FIXED_NOW, makeRoutine, makeRoutineCompletion, makeWorkout } from "../fixtures";

const NOW = FIXED_NOW;

describe("routines", () => {
  it("sums step durations", () => {
    expect(totalDuration(makeRoutine())).toBe(25);
  });

  it("schedules steps back-to-back from the start time", () => {
    const sched = scheduleRoutine(makeRoutine());
    expect(sched[0]!.startMinutes).toBe(360); // 06:00
    expect(sched[0]!.endMinutes).toBe(370); // +10
    expect(sched[1]!.startMinutes).toBe(370);
  });

  it("materializes a routine into planner block drafts (never mutating it)", () => {
    const routine = makeRoutine();
    const blocks = materializeRoutine(routine);
    expect(blocks[0]).toMatchObject({ startTime: "06:00", endTime: "06:10", source: "routine" });
    expect(routine.steps).toHaveLength(2); // unchanged
  });

  it("materializes only active routines, sorted", () => {
    const blocks = materializeRoutines([
      makeRoutine({ id: "r1", startTime: "07:00" }),
      makeRoutine({ id: "r2", status: "paused", startTime: "06:00" }),
    ]);
    expect(blocks.every((b) => b.startTime >= "07:00")).toBe(true);
  });

  it("detects skipped routines past their window", () => {
    // start 06:00, now 20:00 → skipped if not done
    expect(skippedRoutines([makeRoutine()], [], NOW).map((r) => r.id)).toEqual(["routine-1"]);
    expect(skippedRoutines([makeRoutine()], [makeRoutineCompletion()], NOW)).toEqual([]);
  });

  it("finds the next upcoming routine", () => {
    const morning = new Date("2026-07-15T05:00:00Z");
    expect(nextRoutine([makeRoutine()], [], morning)?.id).toBe("routine-1");
    expect(nextRoutine([makeRoutine()], [], NOW)).toBeNull(); // 20:00, all past
  });

  it("computes routine adherence + quality", () => {
    const completions = [
      makeRoutineCompletion({ date: "2026-07-15" }),
      makeRoutineCompletion({ id: "rc2", date: "2026-07-14" }),
    ];
    expect(routineAdherence("routine-1", completions, NOW)).toBeGreaterThan(0);
    expect(averageAdherence([makeRoutine()], completions, NOW)).toBeGreaterThan(0);
    expect(completionQuality(completions)).toBe(100);
  });
});

describe("workouts", () => {
  it("computes set + session volume + load", () => {
    expect(
      setVolume({ exerciseId: "e", reps: 5, weight: 100, durationMinutes: 0, intensity: 8 }),
    ).toBe(500);
    expect(
      setVolume({ exerciseId: "e", reps: 0, weight: 0, durationMinutes: 30, intensity: 6 }),
    ).toBe(180);
    const w = makeWorkout();
    expect(sessionVolume(w)).toBe(1000);
    expect(sessionLoad(w)).toBe(800); // 1000 * 8/10
  });

  it("computes weekly training load with a high flag", () => {
    const heavy = [
      makeWorkout({ id: "a", date: "2026-07-14" }),
      makeWorkout({ id: "b", date: "2026-07-13" }),
    ];
    const load = trainingLoad(heavy, NOW);
    expect(load.sessions).toBe(2);
    expect(load.weeklyVolume).toBe(2000);
    expect(load.high).toBe(true); // >= 1200
  });

  it("counts sessions this week", () => {
    expect(
      sessionsThisWeek(
        [makeWorkout({ date: "2026-07-14" }), makeWorkout({ id: "old", date: "2026-06-01" })],
        NOW,
      ),
    ).toHaveLength(1);
  });

  it("tracks PRs", () => {
    const prs = personalRecords([makeWorkout()]);
    expect(prs.get("ex-1")).toBe(100);
    const newPR = makeWorkout({
      id: "pr",
      sets: [{ exerciseId: "ex-1", reps: 3, weight: 120, durationMinutes: 0, intensity: 9 }],
    });
    expect(isPR(newPR, [makeWorkout()])).toBe(true);
    expect(isPR(makeWorkout(), [makeWorkout()])).toBe(false);
  });
});
