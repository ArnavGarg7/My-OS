import { beforeEach, describe, expect, it, vi } from "vitest";

const h = vi.hoisted(() => ({
  listHabits: vi.fn(),
  listCompletions: vi.fn(),
  listRoutines: vi.fn(),
  listRoutineCompletions: vi.fn(),
  listMedications: vi.fn(),
  listMedicationLogs: vi.fn(),
  listAppointments: vi.fn(),
  listInjuries: vi.fn(),
  listWorkouts: vi.fn(),
  listBody: vi.fn(),
  listVision: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("./repository", () => h);

import { readiness, summary } from "./summary";
import { portfolio } from "./portfolio";
import { statistics, correlations } from "./statistics";
import { signals } from "./signals";
import { routineBlocks } from "./planner";
import {
  dailyCompletions,
  makeAppointment,
  makeHabit,
  makeInjury,
  makeMedication,
  makeRoutine,
  makeVision,
  makeWorkout,
} from "@myos/core/life";

const db = {} as never;

beforeEach(() => {
  vi.clearAllMocks();
  h.listHabits.mockResolvedValue([makeHabit()]);
  h.listCompletions.mockResolvedValue(dailyCompletions("habit-1", "2026-07-15", 10));
  h.listRoutines.mockResolvedValue([makeRoutine()]);
  h.listRoutineCompletions.mockResolvedValue([]);
  h.listMedications.mockResolvedValue([makeMedication()]);
  h.listMedicationLogs.mockResolvedValue([]);
  h.listAppointments.mockResolvedValue([makeAppointment()]);
  h.listInjuries.mockResolvedValue([makeInjury()]);
  h.listWorkouts.mockResolvedValue([makeWorkout()]);
  h.listBody.mockResolvedValue([]);
  h.listVision.mockResolvedValue([makeVision()]);
});

describe("life derivations", () => {
  it("readiness derives a weighted score with components", async () => {
    const r = await readiness(db);
    expect(r.score).toBeGreaterThan(0);
    expect(r.components).toHaveLength(7);
  });

  it("summary derives active habits + readiness", async () => {
    const s = await summary(db);
    expect(s.activeHabits).toBe(1);
    expect(s.readiness).toBeGreaterThan(0);
  });

  it("portfolio derives counts", async () => {
    const p = await portfolio(db);
    expect(p.activeHabits).toBe(1);
    expect(p.activeMedications).toBe(1);
    expect(p.upcomingAppointments).toBe(1);
    expect(p.identityStatements).toBe(1);
  });

  it("statistics derives life balance + consistency", async () => {
    const st = await statistics(db);
    expect(st.habitConsistency).toBeGreaterThan(0);
    expect(st.lifeBalance).toBeGreaterThan(0);
  });

  it("correlations returns a pure Pearson result", async () => {
    const c = await correlations(db);
    expect(c[0]!.pair).toContain("Habits");
  });

  it("signals reflect the life state", async () => {
    const sig = await signals(db);
    expect(typeof sig.medicationDue).toBe("boolean");
    expect(typeof sig.doctorAppointmentSoon).toBe("boolean");
  });

  it("routineBlocks materializes active routines", async () => {
    const blocks = await routineBlocks(db);
    expect(blocks.length).toBeGreaterThan(0);
    expect(blocks[0]!.source).toBe("routine");
  });

  it("empty state yields zeroed derivations", async () => {
    for (const fn of Object.values(h)) fn.mockResolvedValue([]);
    expect((await portfolio(db)).activeHabits).toBe(0);
    expect((await summary(db)).activeHabits).toBe(0);
    expect(await routineBlocks(db)).toEqual([]);
  });
});
