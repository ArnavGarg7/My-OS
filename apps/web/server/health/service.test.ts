import { beforeEach, describe, expect, it, vi } from "vitest";
import type {
  BodyMeasurementRow,
  HealthDailyRow,
  HydrationLogRow,
  NutritionLogRow,
  SleepSessionRow,
  WorkoutRow,
} from "@myos/db/schema";

// HealthService is server-only; mock the DB boundary (repository) and let the
// service → summary → pure HealthEngine compute derived analytics for real.
const h = vi.hoisted(() => ({
  getDaily: vi.fn(),
  upsertDaily: vi.fn(),
  listDaily: vi.fn(),
  listWorkouts: vi.fn(),
  recentWorkouts: vi.fn(),
  getWorkout: vi.fn(),
  insertWorkout: vi.fn(),
  updateWorkout: vi.fn(),
  listSleep: vi.fn(),
  insertSleep: vi.fn(),
  listHydration: vi.fn(),
  insertHydration: vi.fn(),
  listNutrition: vi.fn(),
  insertNutrition: vi.fn(),
  listBody: vi.fn(),
  insertBody: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("./repository", () => h);

import * as service from "./service";

const db = {} as never;
const TZ = "UTC";
const DATE = "2026-07-07";
const D = (h: number, m = 0, day = 7) => new Date(Date.UTC(2026, 6, day, h, m, 0));

function sleepRow(over: Partial<SleepSessionRow> = {}): SleepSessionRow {
  return {
    id: "s1",
    bedTime: D(23, 0, 6),
    wakeTime: D(7, 0, 7),
    durationMinutes: 480,
    quality: 90,
    ...over,
  };
}
function workoutRow(over: Partial<WorkoutRow> = {}): WorkoutRow {
  return {
    id: "w1",
    type: "strength",
    startedAt: D(17, 0),
    endedAt: D(18, 0),
    durationMinutes: 60,
    volume: 5000,
    caloriesBurned: 360,
    rpe: 7,
    completed: true,
    workoutProgramId: null,
    exerciseId: null,
    recoveryNotes: "",
    perceivedExertion: null,
    ...over,
  };
}
function hydrationRow(over: Partial<HydrationLogRow> = {}): HydrationLogRow {
  return { id: "hy1", time: D(9, 0), amountMl: 500, source: "water", ...over };
}
function nutritionRow(over: Partial<NutritionLogRow> = {}): NutritionLogRow {
  return {
    id: "n1",
    meal: "lunch",
    calories: 600,
    protein: 40,
    carbs: 60,
    fat: 20,
    loggedAt: D(13, 0),
    ...over,
  };
}
function bodyRow(over: Partial<BodyMeasurementRow> = {}): BodyMeasurementRow {
  return {
    id: "b1",
    weight: 75,
    bodyFat: 18,
    muscleMass: 35,
    waist: 82,
    recordedAt: D(7, 0),
    bodyFatPercentage: null,
    restingHeartRate: null,
    ...over,
  };
}
function dailyRow(over: Partial<HealthDailyRow> = {}): HealthDailyRow {
  return {
    date: DATE,
    energyLevel: null,
    mood: null,
    stress: null,
    sleepScore: null,
    readinessScore: null,
    waterMl: 0,
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    steps: 0,
    weight: null,
    bodyFat: null,
    notes: "",
    ...over,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  h.getDaily.mockResolvedValue(undefined);
  h.listSleep.mockResolvedValue([]);
  h.listWorkouts.mockResolvedValue([]);
  h.recentWorkouts.mockResolvedValue([]);
  h.listHydration.mockResolvedValue([]);
  h.listNutrition.mockResolvedValue([]);
  h.listBody.mockResolvedValue([]);
  h.listDaily.mockResolvedValue([]);
  h.upsertDaily.mockImplementation((_db: never, date: string, patch: Record<string, unknown>) =>
    Promise.resolve(dailyRow({ date, ...patch })),
  );
});

describe("summary", () => {
  it("assembles a summary from the day's logs", async () => {
    h.listSleep.mockResolvedValue([sleepRow()]);
    h.listHydration.mockResolvedValue([hydrationRow({ amountMl: 1500 })]);
    h.listNutrition.mockResolvedValue([nutritionRow()]);
    const s = await service.summary(db, TZ, DATE);
    expect(s.date).toBe(DATE);
    expect(s.sleep?.durationMinutes).toBe(480);
    expect(s.hydration.totalMl).toBe(1500);
    expect(s.readiness.score).toBeGreaterThan(0);
  });

  it("picks the sleep session waking on the requested date", async () => {
    h.listSleep.mockResolvedValue([sleepRow({ id: "old", wakeTime: D(7, 0, 5) }), sleepRow()]);
    const s = await service.summary(db, TZ, DATE);
    expect(s.sleep?.durationMinutes).toBe(480);
  });

  it("derives readiness with no data (neutral)", async () => {
    const s = await service.summary(db, TZ, DATE);
    expect(s.readiness.score).toBeGreaterThanOrEqual(0);
    expect(s.sleep).toBeNull();
  });
});

describe("signals", () => {
  it("flags low sleep", async () => {
    h.listSleep.mockResolvedValue([sleepRow({ durationMinutes: 300 })]);
    const sig = await service.signals(db, TZ, DATE);
    expect(sig.lowSleep).toBe(true);
  });

  it("exposes readiness + recovery", async () => {
    h.listSleep.mockResolvedValue([sleepRow()]);
    const sig = await service.signals(db, TZ, DATE);
    expect(sig.readiness).toBeGreaterThan(0);
    expect(["recovered", "recovering", "fatigued", "overtrained"]).toContain(sig.recovery);
  });

  it("names next workout from recent history", async () => {
    h.recentWorkouts.mockResolvedValue([workoutRow({ type: "cardio", endedAt: D(18, 0, 6) })]);
    const sig = await service.signals(db, TZ, DATE);
    expect(sig.nextWorkoutType).toBe("cardio");
  });
});

describe("reads", () => {
  it("returns the daily row when present", async () => {
    h.getDaily.mockResolvedValue(dailyRow({ energyLevel: "high" }));
    const d = await service.daily(db, TZ, DATE);
    expect(d?.energyLevel).toBe("high");
  });

  it("returns null daily when absent", async () => {
    expect(await service.daily(db, TZ, DATE)).toBeNull();
  });

  it("lists sleep sessions", async () => {
    h.listSleep.mockResolvedValue([sleepRow()]);
    expect((await service.sleep(db)).length).toBe(1);
  });

  it("lists workouts for a date", async () => {
    h.listWorkouts.mockResolvedValue([workoutRow()]);
    expect((await service.workoutList(db, TZ, DATE)).length).toBe(1);
  });

  it("lists hydration + nutrition + body", async () => {
    h.listHydration.mockResolvedValue([hydrationRow()]);
    h.listNutrition.mockResolvedValue([nutritionRow()]);
    h.listBody.mockResolvedValue([bodyRow()]);
    expect((await service.hydration(db, TZ, DATE)).length).toBe(1);
    expect((await service.nutrition(db, TZ, DATE)).length).toBe(1);
    expect((await service.body(db)).length).toBe(1);
  });

  it("exposes readiness/energy/recovery projections", async () => {
    h.listSleep.mockResolvedValue([sleepRow()]);
    expect((await service.readiness(db, TZ, DATE)).score).toBeGreaterThan(0);
    expect((await service.energy(db, TZ, DATE)).level).toBeDefined();
    expect((await service.recovery(db, TZ, DATE)).status).toBeDefined();
  });
});

describe("trends + history", () => {
  it("computes weight trend + correlations", async () => {
    h.listBody.mockResolvedValue([
      bodyRow({ id: "a", weight: 77, recordedAt: D(7, 0, 5) }),
      bodyRow({ id: "b", weight: 75, recordedAt: D(7, 0, 7) }),
    ]);
    const t = await service.trends(db, 30);
    expect(t.weight.direction).toBe("down");
    expect(Array.isArray(t.correlations)).toBe(true);
  });

  it("returns the daily history window", async () => {
    h.listDaily.mockResolvedValue([dailyRow()]);
    expect((await service.history(db, 14)).length).toBe(1);
  });
});

describe("writes", () => {
  it("logs water and syncs aggregates", async () => {
    h.insertHydration.mockResolvedValue(hydrationRow({ amountMl: 750 }));
    h.listHydration.mockResolvedValue([hydrationRow({ amountMl: 750 })]);
    const log = await service.logWater(db, TZ, { amountMl: 750, source: "water" });
    expect(log.amountMl).toBe(750);
    expect(h.upsertDaily).toHaveBeenCalled();
    const patch = h.upsertDaily.mock.calls.at(-1)?.[2] as { waterMl: number };
    expect(patch.waterMl).toBe(750);
  });

  it("logs a meal and totals calories into the daily", async () => {
    h.insertNutrition.mockResolvedValue(nutritionRow({ calories: 700 }));
    h.listNutrition.mockResolvedValue([nutritionRow({ calories: 700 })]);
    await service.logMeal(db, TZ, {
      meal: "dinner",
      calories: 700,
      protein: 50,
      carbs: 40,
      fat: 20,
    });
    const patch = h.upsertDaily.mock.calls.at(-1)?.[2] as { calories: number };
    expect(patch.calories).toBe(700);
  });

  it("logs a workout with an estimated calorie burn", async () => {
    h.insertWorkout.mockImplementation((_db: never, v: Record<string, unknown>) =>
      Promise.resolve(workoutRow(v as Partial<WorkoutRow>)),
    );
    const w = await service.logWorkout(db, TZ, {
      type: "cardio",
      durationMinutes: 30,
      volume: 0,
      rpe: null,
      completed: true,
    });
    expect(w.caloriesBurned).toBeGreaterThan(0);
    const values = h.insertWorkout.mock.calls[0]?.[1] as { caloriesBurned: number };
    expect(values.caloriesBurned).toBe(300);
  });

  it("finishes a workout, filling duration + completion", async () => {
    h.getWorkout.mockResolvedValue(
      workoutRow({ durationMinutes: 0, completed: false, endedAt: null }),
    );
    h.updateWorkout.mockImplementation((_db: never, _id: string, patch: Record<string, unknown>) =>
      Promise.resolve(workoutRow(patch as Partial<WorkoutRow>)),
    );
    const w = await service.finishWorkout(db, TZ, "w1", D(17, 45).toISOString());
    expect(w.completed).toBe(true);
    expect(w.durationMinutes).toBe(45);
  });

  it("logs sleep computing duration", async () => {
    h.insertSleep.mockImplementation((_db: never, v: Record<string, unknown>) =>
      Promise.resolve(sleepRow(v as Partial<SleepSessionRow>)),
    );
    const s = await service.logSleep(db, TZ, {
      bedTime: D(23, 0, 6).toISOString(),
      wakeTime: D(7, 30, 7).toISOString(),
      quality: 80,
    });
    expect(s.durationMinutes).toBe(510);
  });

  it("updates weight into body + daily", async () => {
    h.insertBody.mockImplementation((_db: never, v: Record<string, unknown>) =>
      Promise.resolve(bodyRow(v as Partial<BodyMeasurementRow>)),
    );
    const m = await service.updateWeight(db, TZ, { weight: 74.5 });
    expect(m.weight).toBe(74.5);
    const patch = h.upsertDaily.mock.calls.at(-1)?.[2] as { weight: number };
    expect(patch.weight).toBe(74.5);
  });

  it("updates energy level", async () => {
    const d = await service.updateEnergy(db, TZ, "high", DATE);
    expect(d.energyLevel).toBe("high");
    expect(h.upsertDaily).toHaveBeenCalledWith(db, DATE, { energyLevel: "high" });
  });

  it("updates mood + stress", async () => {
    await service.updateMood(db, TZ, "good", 3, DATE);
    expect(h.upsertDaily).toHaveBeenCalledWith(db, DATE, { mood: "good", stress: 3 });
  });
});
