import { describe, expect, it } from "vitest";
import {
  EXERCISE_TYPES,
  HABIT_FREQUENCIES,
  INJURY_STATUSES,
  MEDICATION_FREQUENCIES,
  READINESS_WEIGHTS,
  RECOMMENDATION_LEVELS,
  REVIEW_FREQUENCIES,
  ROUTINE_STATUSES,
  ROUTINE_TYPES,
  VISION_CATEGORIES,
  clamp,
  completionQuality,
  computeReadiness,
  correlate,
  dailySupplements,
  defaultInputs,
  dosesPerDay,
  healedInjuries,
  injuryBurden,
  materializeRoutines,
  medicationAdherence,
  minutesToHHMM,
  pearson,
  recoveryPlan,
  soonAppointments,
  strength,
  trend,
  upcomingAppointments,
} from "../index";
import {
  FIXED_NOW,
  makeAppointment,
  makeBody,
  makeInjury,
  makeMedication,
  makeRoutine,
  makeSupplement,
} from "../fixtures";

const NOW = FIXED_NOW;

describe("constants completeness", () => {
  it("declares every enum vocabulary", () => {
    expect(HABIT_FREQUENCIES).toHaveLength(4);
    expect(ROUTINE_TYPES).toHaveLength(7);
    expect(ROUTINE_STATUSES).toHaveLength(3);
    expect(EXERCISE_TYPES).toHaveLength(5);
    expect(INJURY_STATUSES).toHaveLength(3);
    expect(MEDICATION_FREQUENCIES).toHaveLength(5);
    expect(REVIEW_FREQUENCIES).toHaveLength(4);
    expect(VISION_CATEGORIES).toHaveLength(8);
    expect(RECOMMENDATION_LEVELS).toHaveLength(4);
  });
  it("readiness weights sum to 100", () => {
    expect(Object.values(READINESS_WEIGHTS).reduce((a, b) => a + b, 0)).toBe(100);
  });
});

describe("clamp + time helpers", () => {
  it("clamps into range", () => {
    expect(clamp(150)).toBe(100);
    expect(clamp(-10)).toBe(0);
    expect(clamp(50)).toBe(50);
  });
  it("formats minutes to HH:MM with wrap", () => {
    expect(minutesToHHMM(390)).toBe("06:30");
    expect(minutesToHHMM(1440)).toBe("00:00");
    expect(minutesToHHMM(-60)).toBe("23:00");
  });
});

describe("medication frequency mapping", () => {
  for (const f of MEDICATION_FREQUENCIES) {
    it(`maps ${f} to a non-negative doses/day`, () => {
      expect(dosesPerDay(f)).toBeGreaterThanOrEqual(0);
    });
  }
  it("as_needed adherence is 100 (never owed)", () => {
    expect(medicationAdherence(makeMedication({ frequency: "as_needed" }), [], NOW)).toBe(100);
  });
});

describe("supplements + injuries", () => {
  it("lists daily supplements", () => {
    expect(
      dailySupplements([
        makeSupplement({ frequency: "once_daily" }),
        makeSupplement({ id: "s2", frequency: "weekly" }),
      ]),
    ).toHaveLength(1);
  });
  it("lists healed injuries + zero burden when none active", () => {
    expect(healedInjuries([makeInjury({ status: "healed" })])).toHaveLength(1);
    expect(injuryBurden([makeInjury({ status: "healed" })])).toBe(0);
  });
  it("caps injury burden at 100", () => {
    expect(injuryBurden([makeInjury({ severity: 5 }), makeInjury({ id: "i2", severity: 5 })])).toBe(
      100,
    );
  });
});

describe("appointments edge cases", () => {
  it("excludes completed + past appointments", () => {
    const appts = [
      makeAppointment({ id: "done", completed: true }),
      makeAppointment({ id: "past", date: "2026-07-01" }),
      makeAppointment({ id: "future", date: "2026-07-16" }),
    ];
    expect(upcomingAppointments(appts, NOW).map((a) => a.id)).toEqual(["future"]);
  });
  it("empty appointment list yields nothing soon", () => {
    expect(soonAppointments([], NOW)).toEqual([]);
  });
});

describe("body composition edge cases", () => {
  it("trend needs at least two measurements", () => {
    expect(trend([makeBody()], "weightKg")).toBe(0);
  });
  it("computes signed weight trend", () => {
    expect(
      trend(
        [
          makeBody({ date: "2026-07-01", weightKg: 80 }),
          makeBody({ id: "b", date: "2026-07-14", weightKg: 75 }),
        ],
        "weightKg",
      ),
    ).toBe(-5);
  });
});

describe("correlations edge cases", () => {
  it("returns 0 for constant series", () => {
    expect(pearson([1, 1, 1], [2, 4, 6])).toBe(0);
  });
  it("returns 0 for too-few points", () => {
    expect(pearson([1], [2])).toBe(0);
  });
  it("bands moderate + weak", () => {
    expect(strength(0.5)).toBe("moderate");
    expect(strength(0.3)).toBe("weak");
  });
  it("correlate carries the pair label", () => {
    expect(correlate("sleep↔focus", [1, 2, 3, 4, 5], [1, 2, 3, 4, 5]).pair).toBe("sleep↔focus");
  });
});

describe("readiness bands", () => {
  it("ease band in the middle", () => {
    const r = computeReadiness({
      ...defaultInputs(),
      sleep: 45,
      recovery: 45,
      hydration: 45,
      nutrition: 45,
      habitConsistency: 45,
    });
    expect(["ease", "maintain"]).toContain(r.workRecommendation);
  });
  it("no-training-logged load is neutral (60)", () => {
    const r = computeReadiness({ ...defaultInputs(), workoutLoad: 0 });
    expect(r.components.find((c) => c.label === "Workout load")!.value).toBe(60);
  });
  it("recovery plan recommends rest under high risk", () => {
    const plan = recoveryPlan(
      computeReadiness({ ...defaultInputs(), injuryBurden: 95, workoutLoad: 3000 }),
    );
    expect(plan.restDayRecommended).toBe(true);
  });
  it("recovery plan is happy when recovered", () => {
    const plan = recoveryPlan(computeReadiness({ ...defaultInputs(), sleep: 90, recovery: 90 }));
    expect(plan.suggestions.some((s) => s.includes("normal training"))).toBe(true);
  });
});

describe("routine materialization edge cases", () => {
  it("materializes nothing for paused routines", () => {
    expect(materializeRoutines([makeRoutine({ status: "paused" })])).toEqual([]);
  });
  it("routine with no start time defaults to 06:00", () => {
    const blocks = materializeRoutines([makeRoutine({ startTime: null })]);
    expect(blocks[0]!.startTime).toBe("06:00");
  });
  it("completion quality is 0 for no completions", () => {
    expect(completionQuality([])).toBe(0);
  });
});
