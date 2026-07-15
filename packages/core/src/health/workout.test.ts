import { describe, expect, it } from "vitest";
import { at, makeWorkout } from "./fixtures";
import {
  clampRpe,
  completeWorkout,
  estimateCalories,
  intensityBand,
  lastWorkoutType,
  summarizeWorkouts,
  trainingLoad,
} from "./workout";

describe("workout", () => {
  it("estimates calories from type + duration", () => {
    expect(estimateCalories("cardio", 30, null)).toBe(300);
  });

  it("scales calories by RPE intensity", () => {
    const hard = estimateCalories("strength", 60, 10);
    const easy = estimateCalories("strength", 60, 1);
    expect(hard).toBeGreaterThan(easy);
  });

  it("clamps RPE to 1..10", () => {
    expect(clampRpe(0)).toBe(1);
    expect(clampRpe(12)).toBe(10);
  });

  it("bands intensity from RPE", () => {
    expect(intensityBand(2)).toBe("light");
    expect(intensityBand(5)).toBe("moderate");
    expect(intensityBand(8)).toBe("hard");
    expect(intensityBand(10)).toBe("max");
    expect(intensityBand(null)).toBe("moderate");
  });

  it("completes a workout, filling duration + calories", () => {
    const w = makeWorkout({
      durationMinutes: 0,
      caloriesBurned: 0,
      endedAt: null,
      completed: false,
      startedAt: at(17, 0),
      type: "cardio",
      rpe: 5,
    });
    const done = completeWorkout(w, at(17, 40));
    expect(done.completed).toBe(true);
    expect(done.durationMinutes).toBe(40);
    expect(done.caloriesBurned).toBeGreaterThan(0);
  });

  it("summarizes completed workouts only", () => {
    const summary = summarizeWorkouts([
      makeWorkout({ id: "a", durationMinutes: 60, volume: 5000, caloriesBurned: 360, rpe: 7 }),
      makeWorkout({ id: "b", completed: false, durationMinutes: 30 }),
    ]);
    expect(summary.count).toBe(1);
    expect(summary.totalMinutes).toBe(60);
    expect(summary.averageRpe).toBe(7);
  });

  it("averages RPE across sessions", () => {
    const summary = summarizeWorkouts([
      makeWorkout({ id: "a", rpe: 6 }),
      makeWorkout({ id: "b", rpe: 8 }),
    ]);
    expect(summary.averageRpe).toBe(7);
  });

  it("finds the last workout type by end time", () => {
    const workouts = [
      makeWorkout({ id: "a", type: "strength", endedAt: at(10, 0) }),
      makeWorkout({ id: "b", type: "cardio", endedAt: at(18, 0) }),
    ];
    expect(lastWorkoutType(workouts)).toBe("cardio");
  });

  it("returns null last type when none completed", () => {
    expect(lastWorkoutType([makeWorkout({ completed: false })])).toBeNull();
  });

  it("computes training load weighted by intensity", () => {
    const load = trainingLoad([makeWorkout({ durationMinutes: 60, rpe: 10 })]);
    expect(load).toBe(120);
  });
});
