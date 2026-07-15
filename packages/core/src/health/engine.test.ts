import { describe, expect, it } from "vitest";
import {
  at,
  makeBody,
  makeDaily,
  makeHydration,
  makeNutrition,
  makeSleep,
  makeWorkout,
} from "./fixtures";
import { healthEngine, type HealthInput } from "./engine";

function baseInput(over: Partial<HealthInput> = {}): HealthInput {
  return {
    date: "2026-07-07",
    daily: makeDaily(),
    latestSleep: makeSleep({ durationMinutes: 480, quality: 90 }),
    sleepHistory: [],
    workouts: [],
    recentWorkouts: [],
    hydration: [makeHydration({ amountMl: 1500 })],
    nutrition: [makeNutrition()],
    body: [makeBody()],
    ...over,
  };
}

describe("HealthEngine.summary", () => {
  it("assembles a full summary", () => {
    const s = healthEngine.summary(baseInput());
    expect(s.date).toBe("2026-07-07");
    expect(s.sleep?.durationMinutes).toBe(480);
    expect(s.hydration.completionPercent).toBe(50);
    expect(s.readiness.score).toBeGreaterThan(0);
    expect(s.energy.level).toBeDefined();
  });

  it("derives energy from sleep when unlogged", () => {
    const s = healthEngine.summary(baseInput({ daily: makeDaily({ energyLevel: null }) }));
    expect(s.energy.source).toBe("derived");
  });

  it("uses logged energy when present", () => {
    const s = healthEngine.summary(baseInput({ daily: makeDaily({ energyLevel: "high" }) }));
    expect(s.energy.source).toBe("logged");
    expect(s.energy.level).toBe("high");
  });

  it("falls back to body weight when daily weight is null", () => {
    const s = healthEngine.summary(
      baseInput({ daily: makeDaily({ weight: null }), body: [makeBody({ weight: 74 })] }),
    );
    expect(s.weight).toBe(74);
  });

  it("summarizes today's workouts", () => {
    const s = healthEngine.summary(baseInput({ workouts: [makeWorkout({ durationMinutes: 45 })] }));
    expect(s.workouts.count).toBe(1);
    expect(s.workouts.totalMinutes).toBe(45);
  });
});

describe("HealthEngine.signals", () => {
  it("exposes readiness/recovery/energy signals", () => {
    const sig = healthEngine.signals(baseInput());
    expect(sig.readiness).toBeGreaterThan(0);
    expect(sig.recovery).toBeDefined();
    expect(sig.sleepMinutes).toBe(480);
    expect(sig.lowSleep).toBe(false);
  });

  it("flags low sleep", () => {
    const sig = healthEngine.signals(
      baseInput({ latestSleep: makeSleep({ durationMinutes: 300 }) }),
    );
    expect(sig.lowSleep).toBe(true);
  });

  it("flags high readiness with strong inputs", () => {
    const sig = healthEngine.signals(
      baseInput({
        daily: makeDaily({ energyLevel: "high" }),
        hydration: [makeHydration({ amountMl: 3000 })],
      }),
    );
    expect(sig.highReadiness).toBe(true);
  });

  it("names the next workout type from recent history", () => {
    const sig = healthEngine.signals(
      baseInput({ recentWorkouts: [makeWorkout({ type: "cardio", endedAt: at(18, 0) })] }),
    );
    expect(sig.nextWorkoutType).toBe("cardio");
  });
});

describe("HealthEngine helpers", () => {
  it("completes a workout deterministically", () => {
    const w = makeWorkout({
      durationMinutes: 0,
      caloriesBurned: 0,
      completed: false,
      startedAt: at(17, 0),
      type: "cardio",
      rpe: 5,
    });
    const done = healthEngine.completeWorkout(w, at(17, 30));
    expect(done.completed).toBe(true);
    expect(done.durationMinutes).toBe(30);
  });

  it("sets a daily energy level", () => {
    expect(healthEngine.setEnergy(makeDaily(), "low").energyLevel).toBe("low");
  });
});
