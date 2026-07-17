import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  appointmentRowTo,
  bodyRowTo,
  completionRowToCompletion,
  habitRowToHabit,
  injuryRowTo,
  medicationLogRowTo,
  medicationRowTo,
  reviewRowTo,
  routineRowToRoutine,
  supplementRowTo,
  visionRowTo,
  workoutRowTo,
} from "./mapper";
import type {
  DoctorAppointmentRow,
  HabitCompletionRow,
  InjuryRow,
  LifeBodyMeasurementRow,
  LifeHabitRow,
  MedicationLogRow,
  MedicationRow,
  PersonalReviewRow,
  RoutineRow,
  RoutineStepRow,
  SupplementRow,
  VisionItemRow,
  WorkoutSessionRow,
} from "@myos/db/schema";

const D = (s: string) => new Date(s);

describe("life mappers", () => {
  it("maps a habit row", () => {
    const row: LifeHabitRow = {
      id: "h1",
      name: "Meditate",
      description: "",
      frequency: "daily",
      target: 1,
      daysOfWeek: [1, 3],
      goalId: null,
      knowledgeNoteId: null,
      archived: false,
      createdAt: D("2026-06-01T09:00:00Z"),
      updatedAt: D("2026-07-15T09:00:00Z"),
    };
    const h = habitRowToHabit(row);
    expect(h.frequency).toBe("daily");
    expect(h.daysOfWeek).toEqual([1, 3]);
  });

  it("maps a completion row", () => {
    const row: HabitCompletionRow = {
      id: "c1",
      habitId: "h1",
      date: "2026-07-15",
      completedAt: D("2026-07-15T08:00:00Z"),
    };
    expect(completionRowToCompletion(row).date).toBe("2026-07-15");
  });

  it("maps a routine row + sorted steps", () => {
    const row: RoutineRow = {
      id: "r1",
      name: "AM",
      type: "morning",
      status: "active",
      knowledgeNoteId: null,
      startTime: "06:00",
      createdAt: D("2026-06-01T09:00:00Z"),
      updatedAt: D("2026-07-14T09:00:00Z"),
    };
    const steps: RoutineStepRow[] = [
      {
        id: "s2",
        routineId: "r1",
        stepOrder: 1,
        title: "Journal",
        durationMinutes: 15,
        linkedTaskId: null,
        linkedHabitId: null,
      },
      {
        id: "s1",
        routineId: "r1",
        stepOrder: 0,
        title: "Stretch",
        durationMinutes: 10,
        linkedTaskId: null,
        linkedHabitId: null,
      },
    ];
    const routine = routineRowToRoutine(row, steps);
    expect(routine.steps.map((s) => s.title)).toEqual(["Stretch", "Journal"]);
  });

  it("maps medication + log + supplement rows", () => {
    const med: MedicationRow = {
      id: "m1",
      name: "Vit D",
      dosage: "1000 IU",
      frequency: "once_daily",
      timeOfDay: "08:00",
      active: true,
      notes: "",
      createdAt: D("2026-06-01T09:00:00Z"),
      updatedAt: D("2026-07-14T09:00:00Z"),
    };
    expect(medicationRowTo(med).frequency).toBe("once_daily");
    const log: MedicationLogRow = {
      id: "ml1",
      medicationId: "m1",
      takenAt: D("2026-07-15T08:00:00Z"),
    };
    expect(medicationLogRowTo(log).medicationId).toBe("m1");
    const sup: SupplementRow = {
      id: "s1",
      name: "Creatine",
      dosage: "5g",
      frequency: "once_daily",
      active: true,
      notes: "",
      createdAt: D("2026-06-01T09:00:00Z"),
      updatedAt: D("2026-07-14T09:00:00Z"),
    };
    expect(supplementRowTo(sup).name).toBe("Creatine");
  });

  it("maps appointment + injury rows", () => {
    const appt: DoctorAppointmentRow = {
      id: "a1",
      title: "Physical",
      provider: "Dr. Rao",
      date: "2026-07-16",
      time: "10:00",
      location: "Clinic",
      notes: "",
      completed: false,
      createdAt: D("2026-07-01T09:00:00Z"),
      updatedAt: D("2026-07-01T09:00:00Z"),
    };
    expect(appointmentRowTo(appt).date).toBe("2026-07-16");
    const inj: InjuryRow = {
      id: "i1",
      name: "Ankle",
      bodyPart: "ankle",
      knowledgeNoteId: null,
      status: "recovering",
      severity: 3,
      notes: "",
      startedAt: D("2026-07-01T09:00:00Z"),
      healedAt: null,
      createdAt: D("2026-07-01T09:00:00Z"),
      updatedAt: D("2026-07-10T09:00:00Z"),
    };
    const injury = injuryRowTo(inj);
    expect(injury.status).toBe("recovering");
    expect(injury.healedAt).toBeNull();
  });

  it("maps workout + body + review + vision rows", () => {
    const wo: WorkoutSessionRow = {
      id: "w1",
      programId: null,
      date: "2026-07-14",
      sets: [{ exerciseId: "e1", reps: 5, weight: 100, durationMinutes: 0, intensity: 8 }],
      perceivedExertion: 8,
      recoveryNotes: "",
      createdAt: D("2026-07-14T18:00:00Z"),
    };
    expect(workoutRowTo(wo).sets).toHaveLength(1);
    const body: LifeBodyMeasurementRow = {
      id: "b1",
      date: "2026-07-14",
      weightKg: 75,
      bodyFatPercentage: 18,
      restingHeartRate: 58,
      bloodPressureSystolic: 120,
      bloodPressureDiastolic: 80,
      notes: "",
      createdAt: D("2026-07-14T09:00:00Z"),
    };
    expect(bodyRowTo(body).restingHeartRate).toBe(58);
    const review: PersonalReviewRow = {
      id: "pr1",
      knowledgeNoteId: null,
      frequency: "weekly",
      periodStart: "2026-07-13",
      wins: ["a"],
      lessons: [],
      focusNext: [],
      notes: "",
      createdAt: D("2026-07-15T09:00:00Z"),
    };
    expect(reviewRowTo(review).wins).toEqual(["a"]);
    const vision: VisionItemRow = {
      id: "v1",
      knowledgeNoteId: null,
      category: "health",
      statement: "I train.",
      isIdentity: true,
      createdAt: D("2026-06-01T09:00:00Z"),
    };
    expect(visionRowTo(vision).isIdentity).toBe(true);
  });
});
