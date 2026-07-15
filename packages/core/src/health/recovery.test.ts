import { describe, expect, it } from "vitest";
import { makeSleep, makeWorkout } from "./fixtures";
import { analyzeSleep } from "./sleep";
import { assessRecovery } from "./recovery";

const goodSleep = analyzeSleep(makeSleep({ durationMinutes: 480, quality: 90 }));
const badSleep = analyzeSleep(makeSleep({ durationMinutes: 240, quality: 30 }));

describe("recovery", () => {
  it("is recovered after good sleep and no load", () => {
    const r = assessRecovery({ sleep: goodSleep, recentWorkouts: [], energy: "high" });
    expect(r.status).toBe("recovered");
    expect(r.score).toBeGreaterThanOrEqual(80);
  });

  it("is fatigued after poor sleep", () => {
    const r = assessRecovery({ sleep: badSleep, recentWorkouts: [], energy: "low" });
    expect(["fatigued", "recovering"]).toContain(r.status);
    expect(r.reasons.join(" ")).toMatch(/sleep/i);
  });

  it("penalizes high training load", () => {
    const heavy = [
      makeWorkout({ id: "a", durationMinutes: 90, rpe: 9 }),
      makeWorkout({ id: "b", durationMinutes: 90, rpe: 9 }),
    ];
    const r = assessRecovery({ sleep: goodSleep, recentWorkouts: heavy, energy: "medium" });
    expect(r.reasons.join(" ")).toMatch(/training load/i);
    expect(r.score).toBeLessThan(80);
  });

  it("flags overtrained with very high load and low score", () => {
    const crushing = [
      makeWorkout({ id: "a", durationMinutes: 120, rpe: 10 }),
      makeWorkout({ id: "b", durationMinutes: 120, rpe: 10 }),
    ];
    const r = assessRecovery({ sleep: badSleep, recentWorkouts: crushing, energy: "low" });
    expect(r.status).toBe("overtrained");
  });

  it("notes missing sleep", () => {
    const r = assessRecovery({ sleep: null, recentWorkouts: [], energy: null });
    expect(r.reasons.join(" ")).toMatch(/no sleep/i);
  });

  it("clamps the score to 0..100", () => {
    const r = assessRecovery({ sleep: goodSleep, recentWorkouts: [], energy: "high" });
    expect(r.score).toBeLessThanOrEqual(100);
    expect(r.score).toBeGreaterThanOrEqual(0);
  });
});
