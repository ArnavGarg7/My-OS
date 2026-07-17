import { beforeEach, describe, expect, it, vi } from "vitest";

const h = vi.hoisted(() => ({
  insertHabit: vi.fn(),
  updateHabitRow: vi.fn(),
  insertCompletion: vi.fn(),
  insertRoutine: vi.fn(),
  getRoutine: vi.fn(),
  completeRoutine: vi.fn(),
  insertMedication: vi.fn(),
  logMedication: vi.fn(),
  insertWorkout: vi.fn(),
  insertBody: vi.fn(),
  insertInjury: vi.fn(),
  updateInjuryRow: vi.fn(),
  insertReview: vi.fn(),
  insertVision: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("./repository", () => h);

import {
  completeHabit,
  completeRoutine,
  createHabit,
  createInjury,
  createReview,
  createRoutine,
  createVision,
  logBody,
  logMedication,
  logWorkout,
} from "./service";
import { makeRoutine } from "@myos/core/life";

const db = {} as never;

beforeEach(() => {
  vi.clearAllMocks();
  h.insertHabit.mockImplementation((_db, x) => Promise.resolve(x));
  h.insertRoutine.mockImplementation((_db, x) => Promise.resolve(x));
  h.insertCompletion.mockResolvedValue({ id: "c1" });
  h.completeRoutine.mockResolvedValue({ id: "rc1" });
  h.getRoutine.mockResolvedValue(makeRoutine());
  h.insertMedication.mockImplementation((_db, x) => Promise.resolve(x));
  h.logMedication.mockResolvedValue({ id: "ml1" });
  h.insertWorkout.mockImplementation((_db, x) => Promise.resolve(x));
  h.insertBody.mockImplementation((_db, x) => Promise.resolve(x));
  h.insertInjury.mockImplementation((_db, x) => Promise.resolve(x));
  h.insertReview.mockImplementation((_db, x) => Promise.resolve(x));
  h.insertVision.mockImplementation((_db, x) => Promise.resolve(x));
});

describe("life service", () => {
  it("createHabit mints a habit via the engine", async () => {
    const habit = await createHabit(db, { name: "Meditate" });
    expect(habit.name).toBe("Meditate");
    expect(habit.frequency).toBe("daily");
    expect(h.insertHabit).toHaveBeenCalledOnce();
  });

  it("completeHabit logs a completion for today by default", async () => {
    await completeHabit(db, "habit-1");
    expect(h.insertCompletion).toHaveBeenCalledWith(
      db,
      "habit-1",
      expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
    );
  });

  it("createRoutine mints a routine with ordered steps", async () => {
    const routine = await createRoutine(db, {
      name: "AM",
      steps: [{ title: "Stretch" }, { title: "Journal" }],
    });
    expect(routine.steps).toHaveLength(2);
    expect(routine.steps[0]!.order).toBe(0);
  });

  it("completeRoutine defaults completedSteps to the routine's step count", async () => {
    await completeRoutine(db, "routine-1");
    expect(h.completeRoutine).toHaveBeenCalledWith(db, "routine-1", 2, 2, expect.any(String));
  });

  it("completeRoutine returns null for a missing routine", async () => {
    h.getRoutine.mockResolvedValue(null);
    expect(await completeRoutine(db, "ghost")).toBeNull();
  });

  it("logMedication + logWorkout + logBody delegate to the repo", async () => {
    await logMedication(db, "med-1");
    await logWorkout(db, { sets: [] });
    await logBody(db, { weightKg: 75 });
    expect(h.logMedication).toHaveBeenCalledWith(db, "med-1");
    expect(h.insertWorkout).toHaveBeenCalled();
    expect(h.insertBody).toHaveBeenCalled();
  });

  it("createInjury + createReview + createVision persist", async () => {
    await createInjury(db, { name: "Ankle" });
    await createReview(db, {
      frequency: "weekly",
      wins: [],
      lessons: [],
      focusNext: [],
      notes: "",
      knowledgeNoteId: null,
    });
    await createVision(db, {
      category: "health",
      statement: "I train.",
      isIdentity: true,
      knowledgeNoteId: null,
    });
    expect(h.insertInjury).toHaveBeenCalled();
    expect(h.insertReview).toHaveBeenCalled();
    expect(h.insertVision).toHaveBeenCalled();
  });
});
