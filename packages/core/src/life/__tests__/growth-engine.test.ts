import { describe, expect, it } from "vitest";
import {
  buildPortfolio,
  buildReview,
  buildStatistics,
  buildSummary,
  computeSignals,
  createLifeEngine,
  habitInputSchema,
  routineInputSchema,
  reviewInputSchema,
  visionInputSchema,
  HABIT_FREQUENCIES,
  ROUTINE_TYPES,
  VISION_CATEGORIES,
} from "../index";
import {
  FIXED_NOW,
  dailyCompletions,
  makeAppointment,
  makeHabit,
  makeInjury,
  makeMedication,
  makeRoutine,
  makeVision,
  makeWorkout,
} from "../fixtures";

const NOW = FIXED_NOW;

describe("review engine", () => {
  it("builds a deterministic structured review", () => {
    const review = buildReview("weekly", {
      habitAdherence: 80,
      routineConsistency: 90,
      goalVelocity: 40,
      healthImprovement: 70,
      knowledgeGrowth: 30,
      learningConsistency: 85,
      workoutConsistency: 60,
      readingConsistency: 20,
    });
    expect(review.overall).toBe(59);
    expect(review.highlights.some((h) => h.includes("Routine consistency"))).toBe(true);
    expect(review.concerns.some((c) => c.includes("Reading consistency"))).toBe(true);
  });
});

describe("portfolio + statistics", () => {
  const base = {
    habits: [makeHabit()],
    completions: dailyCompletions("habit-1", "2026-07-15", 10),
    routines: [makeRoutine()],
    medications: [makeMedication()],
    injuries: [makeInjury()],
    appointments: [makeAppointment()],
    workouts: [makeWorkout()],
    vision: [makeVision(), makeVision({ id: "v2", category: "career", isIdentity: false })],
    now: NOW,
  };

  it("builds a derived portfolio", () => {
    const p = buildPortfolio(base);
    expect(p.activeHabits).toBe(1);
    expect(p.bestStreak).toBe(10);
    expect(p.activeMedications).toBe(1);
    expect(p.activeInjuries).toBe(1);
    expect(p.upcomingAppointments).toBe(1);
    expect(p.identityStatements).toBe(1);
  });

  it("builds life statistics with life balance", () => {
    const s = buildStatistics({
      habits: base.habits,
      completions: base.completions,
      routines: base.routines,
      routineCompletions: [],
      workouts: base.workouts,
      vision: base.vision,
      recovery: 70,
      growthVelocity: 55,
      now: NOW,
    });
    expect(s.habitConsistency).toBeGreaterThan(0);
    expect(s.recovery).toBe(70);
    expect(s.lifeBalance).toBe(Math.round((2 / VISION_CATEGORIES.length) * 100));
  });
});

describe("signals + summary", () => {
  it("computes life signals", () => {
    const signals = computeSignals({
      habits: [makeHabit({ id: "hx" })],
      completions: [],
      routines: [makeRoutine()],
      routineCompletions: [],
      medications: [makeMedication({ frequency: "twice_daily" })],
      medicationLogs: [],
      appointments: [makeAppointment({ date: "2026-07-16" })],
      workouts: [makeWorkout({ id: "a" }), makeWorkout({ id: "b", date: "2026-07-13" })],
      recovery: 30,
      identityGoalStalled: true,
      now: NOW,
    });
    expect(signals.habitStreakAtRisk).toBe(true);
    expect(signals.routineSkipped).toBe(true);
    expect(signals.lowRecovery).toBe(true);
    expect(signals.doctorAppointmentSoon).toBe(true);
    expect(signals.medicationDue).toBe(true);
    expect(signals.trainingLoadHigh).toBe(true);
    expect(signals.identityGoalStalled).toBe(true);
  });

  it("builds a compact summary", () => {
    const summary = buildSummary({
      habits: [makeHabit()],
      completions: dailyCompletions("habit-1", "2026-07-15", 3),
      routines: [makeRoutine({ startTime: "22:00" })],
      routineCompletions: [],
      medications: [makeMedication({ frequency: "twice_daily" })],
      medicationLogs: [],
      workouts: [makeWorkout()],
      readiness: 72,
      now: NOW,
    });
    expect(summary.activeHabits).toBe(1);
    expect(summary.habitsCompletedToday).toBe(1);
    expect(summary.bestStreak).toBe(3);
    expect(summary.readiness).toBe(72);
    expect(summary.medicationDue).toBe(true);
    expect(summary.nextRoutine).toBe("Morning Routine");
  });
});

describe("LifeEngine", () => {
  const engine = createLifeEngine(
    (() => {
      let n = 0;
      return () => `id-${(n += 1)}`;
    })(),
    () => NOW,
  );

  it("makes a habit with defaults", () => {
    const habit = engine.makeHabit({ name: "Read" });
    expect(habit.frequency).toBe("daily");
    expect(habit.target).toBe(1);
    expect(habit.id).toMatch(/^id-/);
  });

  it("makes a routine assigning step ids + order", () => {
    const routine = engine.makeRoutine({
      name: "Evening",
      type: "evening",
      steps: [{ title: "Read" }, { title: "Stretch" }],
    });
    expect(routine.steps).toHaveLength(2);
    expect(routine.steps[0]!.order).toBe(0);
    expect(routine.steps[1]!.order).toBe(1);
    expect(routine.steps[0]!.routineId).toBe(routine.id);
  });
});

describe("schemas + constants", () => {
  it("declares the vocabularies", () => {
    expect(HABIT_FREQUENCIES).toContain("daily");
    expect(ROUTINE_TYPES).toContain("morning");
    expect(VISION_CATEGORIES).toContain("health");
  });

  it("validates inputs", () => {
    expect(habitInputSchema.safeParse({ name: "Meditate", frequency: "daily" }).success).toBe(true);
    expect(habitInputSchema.safeParse({ name: "" }).success).toBe(false);
    expect(
      routineInputSchema.safeParse({ name: "AM", steps: [{ title: "Stretch" }] }).success,
    ).toBe(true);
    expect(reviewInputSchema.safeParse({ frequency: "weekly" }).success).toBe(true);
    expect(visionInputSchema.safeParse({ category: "health", statement: "I train." }).success).toBe(
      true,
    );
    expect(visionInputSchema.safeParse({ category: "invalid", statement: "x" }).success).toBe(
      false,
    );
  });
});
