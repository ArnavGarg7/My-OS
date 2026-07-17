import { describe, expect, it } from "vitest";
import {
  activeInjuries,
  activeMedications,
  activeSupplements,
  computeReadiness,
  correlate,
  defaultInputs,
  dosesPerDay,
  dueMedications,
  injuryBurden,
  latest,
  medicationAdherence,
  pearson,
  recoveryPlan,
  restingHeartRateImproving,
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
  makeMedicationLog,
  makeSupplement,
} from "../fixtures";

const NOW = FIXED_NOW;

describe("advanced health", () => {
  it("filters active medications + supplements + injuries", () => {
    expect(
      activeMedications([makeMedication(), makeMedication({ id: "m2", active: false })]),
    ).toHaveLength(1);
    expect(
      activeSupplements([makeSupplement(), makeSupplement({ id: "s2", active: false })]),
    ).toHaveLength(1);
    expect(
      activeInjuries([
        makeInjury({ status: "recovering" }),
        makeInjury({ id: "i2", status: "healed" }),
      ]),
    ).toHaveLength(1);
  });

  it("maps medication frequency to doses/day", () => {
    expect(dosesPerDay("twice_daily")).toBe(2);
    expect(dosesPerDay("as_needed")).toBe(0);
  });

  it("finds due medications (expected > logged today)", () => {
    const meds = [makeMedication({ frequency: "twice_daily" })];
    expect(dueMedications(meds, [makeMedicationLog()], NOW)).toHaveLength(1); // 1 of 2 taken
    expect(
      dueMedications(meds, [makeMedicationLog({ id: "a" }), makeMedicationLog({ id: "b" })], NOW),
    ).toHaveLength(0);
  });

  it("computes medication adherence", () => {
    const med = makeMedication({ frequency: "once_daily" });
    const logs = Array.from({ length: 15 }, (_, i) =>
      makeMedicationLog({
        id: `l${i}`,
        takenAt: `2026-07-${String(i + 1).padStart(2, "0")}T08:00:00Z`,
      }),
    );
    expect(medicationAdherence(med, logs, NOW)).toBeGreaterThan(0);
  });

  it("computes injury burden", () => {
    expect(injuryBurden([makeInjury({ severity: 3 })])).toBe(36);
    expect(injuryBurden([])).toBe(0);
  });

  it("lists upcoming + soon appointments", () => {
    const appts = [
      makeAppointment({ date: "2026-07-16" }),
      makeAppointment({ id: "a2", date: "2026-08-01" }),
    ];
    expect(upcomingAppointments(appts, NOW)).toHaveLength(2);
    expect(soonAppointments(appts, NOW).map((a) => a.id)).toEqual(["appt-1"]); // within 2 days
  });

  it("reads latest body measurement + trend", () => {
    const measurements = [
      makeBody({ date: "2026-07-01", restingHeartRate: 62 }),
      makeBody({ id: "b2", date: "2026-07-14", restingHeartRate: 58 }),
    ];
    expect(latest(measurements)!.date).toBe("2026-07-14");
    expect(trend(measurements, "restingHeartRate")).toBe(-4);
    expect(restingHeartRateImproving(measurements)).toBe(true);
  });
});

describe("readiness expansion", () => {
  it("computes a weighted readiness with components", () => {
    const r = computeReadiness(defaultInputs());
    expect(r.score).toBeGreaterThan(0);
    expect(r.components).toHaveLength(7);
    expect(["push", "maintain", "ease", "rest"]).toContain(r.trainingRecommendation);
  });

  it("is deterministic", () => {
    expect(computeReadiness(defaultInputs())).toEqual(computeReadiness(defaultInputs()));
  });

  it("recommends rest under high risk", () => {
    const r = computeReadiness({
      ...defaultInputs(),
      injuryBurden: 90,
      sleep: 30,
      workoutLoad: 2000,
    });
    expect(r.risk).toBeGreaterThanOrEqual(60);
    expect(r.trainingRecommendation).toBe("rest");
  });

  it("recommends push when fully recovered", () => {
    const r = computeReadiness({
      ...defaultInputs(),
      sleep: 95,
      recovery: 95,
      hydration: 95,
      nutrition: 95,
      habitConsistency: 95,
    });
    expect(r.trainingRecommendation).toBe("push");
  });

  it("builds a recovery plan", () => {
    const plan = recoveryPlan(computeReadiness({ ...defaultInputs(), sleep: 40, hydration: 40 }));
    expect(plan.suggestions.length).toBeGreaterThan(0);
  });
});

describe("correlations", () => {
  it("computes Pearson correlation", () => {
    expect(pearson([1, 2, 3, 4], [2, 4, 6, 8])).toBe(1);
    expect(pearson([1, 2, 3, 4], [8, 6, 4, 2])).toBe(-1);
  });

  it("bands correlation strength", () => {
    expect(strength(0.8)).toBe("strong");
    expect(strength(0.1)).toBe("none");
  });

  it("requires a minimum sample size", () => {
    expect(correlate("a↔b", [1, 2], [2, 4]).strength).toBe("none");
    const c = correlate("a↔b", [1, 2, 3, 4, 5], [2, 4, 6, 8, 10]);
    expect(c.coefficient).toBe(1);
    expect(c.samples).toBe(5);
  });
});
