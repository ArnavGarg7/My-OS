import { describe, expect, it } from "vitest";
import { at, makeDaily, makeSleep, makeWorkout } from "./fixtures";
import { dailyByDate, sleepForNight, standardCorrelations, workoutsOn } from "./selectors";

describe("selectors", () => {
  it("finds a daily by date", () => {
    const list = [makeDaily({ date: "2026-07-06" }), makeDaily({ date: "2026-07-07" })];
    expect(dailyByDate(list, "2026-07-07")?.date).toBe("2026-07-07");
    expect(dailyByDate(list, "2026-07-08")).toBeNull();
  });

  it("finds the sleep session whose wake falls on a date", () => {
    const sessions = [
      makeSleep({ id: "a", wakeTime: at(7, 0, 6) }),
      makeSleep({ id: "b", wakeTime: at(7, 0, 7) }),
    ];
    expect(sleepForNight(sessions, "2026-07-07")?.id).toBe("b");
  });

  it("filters workouts by start date", () => {
    const workouts = [
      makeWorkout({ id: "a", startedAt: at(17, 0, 6) }),
      makeWorkout({ id: "b", startedAt: at(17, 0, 7) }),
    ];
    expect(workoutsOn(workouts, "2026-07-07").map((w) => w.id)).toEqual(["b"]);
  });

  it("builds the standard correlation set aligned by date", () => {
    const dailies = [
      makeDaily({ date: "2026-07-05", energyLevel: "low", waterMl: 1000, protein: 40 }),
      makeDaily({ date: "2026-07-06", energyLevel: "medium", waterMl: 2000, protein: 80 }),
      makeDaily({ date: "2026-07-07", energyLevel: "high", waterMl: 3000, protein: 120 }),
    ];
    const sessions = [
      makeSleep({ id: "a", wakeTime: at(7, 0, 5), durationMinutes: 360 }),
      makeSleep({ id: "b", wakeTime: at(7, 0, 6), durationMinutes: 420 }),
      makeSleep({ id: "c", wakeTime: at(7, 0, 7), durationMinutes: 480 }),
    ];
    const cors = standardCorrelations(dailies, sessions);
    expect(cors).toHaveLength(3);
    // sleep↑ with energy↑ → strong positive.
    const sleepVsEnergy = cors.find((c) => c.a === "sleep");
    expect(sleepVsEnergy?.coefficient).toBeGreaterThan(0.9);
  });
});
