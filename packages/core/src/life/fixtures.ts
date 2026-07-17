import type {
  BodyMeasurement,
  DoctorAppointment,
  Habit,
  HabitCompletion,
  Injury,
  Medication,
  MedicationLog,
  Routine,
  RoutineCompletion,
  Supplement,
  VisionItem,
  WorkoutSession,
} from "./types";

/**
 * Deterministic life fixtures (Sprint 4.2). Fixed ids + timestamps so streaks, readiness,
 * portfolio, statistics and correlations are reproducible in tests.
 */
export const FIXED_NOW = new Date("2026-07-15T20:00:00.000Z"); // 8pm — past the risk hour

let counter = 0;
export function makeCounterId(prefix = "l"): () => string {
  return () => `${prefix}-${(counter += 1)}`;
}
export function resetCounter(): void {
  counter = 0;
}

export function makeHabit(over: Partial<Habit> = {}): Habit {
  return {
    id: "habit-1",
    name: "Meditate",
    description: "",
    frequency: "daily",
    target: 1,
    daysOfWeek: [],
    goalId: null,
    knowledgeNoteId: null,
    archived: false,
    createdAt: "2026-06-01T09:00:00.000Z",
    updatedAt: "2026-07-15T09:00:00.000Z",
    ...over,
  };
}

/** N consecutive daily completions ending on `endDate` (inclusive). */
export function dailyCompletions(
  habitId: string,
  endDate: string,
  count: number,
): HabitCompletion[] {
  const out: HabitCompletion[] = [];
  const end = new Date(`${endDate}T00:00:00Z`);
  for (let i = 0; i < count; i++) {
    const d = new Date(end);
    d.setUTCDate(d.getUTCDate() - i);
    const date = d.toISOString().slice(0, 10);
    out.push({ id: `c-${habitId}-${i}`, habitId, date, completedAt: `${date}T08:00:00.000Z` });
  }
  return out;
}

export function makeRoutine(over: Partial<Routine> = {}): Routine {
  const steps = over.steps ?? [
    {
      id: "step-1",
      routineId: "routine-1",
      order: 0,
      title: "Stretch",
      durationMinutes: 10,
      linkedTaskId: null,
      linkedHabitId: null,
    },
    {
      id: "step-2",
      routineId: "routine-1",
      order: 1,
      title: "Journal",
      durationMinutes: 15,
      linkedTaskId: null,
      linkedHabitId: null,
    },
  ];
  return {
    id: "routine-1",
    name: "Morning Routine",
    type: "morning",
    status: "active",
    startTime: "06:00",
    steps,
    knowledgeNoteId: null,
    createdAt: "2026-06-01T09:00:00.000Z",
    updatedAt: "2026-07-14T09:00:00.000Z",
    ...over,
  };
}

export function makeRoutineCompletion(over: Partial<RoutineCompletion> = {}): RoutineCompletion {
  return {
    id: "rc-1",
    routineId: "routine-1",
    date: "2026-07-15",
    completedSteps: 2,
    totalSteps: 2,
    completedAt: "2026-07-15T06:30:00.000Z",
    ...over,
  };
}

export function makeMedication(over: Partial<Medication> = {}): Medication {
  return {
    id: "med-1",
    name: "Vitamin D",
    dosage: "1000 IU",
    frequency: "once_daily",
    timeOfDay: "08:00",
    active: true,
    notes: "",
    createdAt: "2026-06-01T09:00:00.000Z",
    updatedAt: "2026-07-14T09:00:00.000Z",
    ...over,
  };
}

export function makeMedicationLog(over: Partial<MedicationLog> = {}): MedicationLog {
  return { id: "ml-1", medicationId: "med-1", takenAt: "2026-07-15T08:00:00.000Z", ...over };
}

export function makeSupplement(over: Partial<Supplement> = {}): Supplement {
  return {
    id: "sup-1",
    name: "Creatine",
    dosage: "5g",
    frequency: "once_daily",
    active: true,
    notes: "",
    createdAt: "2026-06-01T09:00:00.000Z",
    updatedAt: "2026-07-14T09:00:00.000Z",
    ...over,
  };
}

export function makeAppointment(over: Partial<DoctorAppointment> = {}): DoctorAppointment {
  return {
    id: "appt-1",
    title: "Annual physical",
    provider: "Dr. Rao",
    date: "2026-07-16",
    time: "10:00",
    location: "City Clinic",
    notes: "",
    completed: false,
    createdAt: "2026-07-01T09:00:00.000Z",
    updatedAt: "2026-07-01T09:00:00.000Z",
    ...over,
  };
}

export function makeInjury(over: Partial<Injury> = {}): Injury {
  return {
    id: "inj-1",
    name: "Sprained ankle",
    bodyPart: "ankle",
    status: "recovering",
    severity: 3,
    notes: "",
    startedAt: "2026-07-01T09:00:00.000Z",
    healedAt: null,
    knowledgeNoteId: null,
    createdAt: "2026-07-01T09:00:00.000Z",
    updatedAt: "2026-07-10T09:00:00.000Z",
    ...over,
  };
}

export function makeWorkout(over: Partial<WorkoutSession> = {}): WorkoutSession {
  return {
    id: "wo-1",
    programId: null,
    date: "2026-07-14",
    sets: [
      { exerciseId: "ex-1", reps: 5, weight: 100, durationMinutes: 0, intensity: 8 },
      { exerciseId: "ex-1", reps: 5, weight: 100, durationMinutes: 0, intensity: 8 },
    ],
    perceivedExertion: 8,
    recoveryNotes: "",
    createdAt: "2026-07-14T18:00:00.000Z",
    ...over,
  };
}

export function makeBody(over: Partial<BodyMeasurement> = {}): BodyMeasurement {
  return {
    id: "body-1",
    date: "2026-07-14",
    weightKg: 75,
    bodyFatPercentage: 18,
    restingHeartRate: 58,
    bloodPressureSystolic: 120,
    bloodPressureDiastolic: 80,
    notes: "",
    createdAt: "2026-07-14T09:00:00.000Z",
    ...over,
  };
}

export function makeVision(over: Partial<VisionItem> = {}): VisionItem {
  return {
    id: "vis-1",
    category: "health",
    statement: "I am someone who trains consistently.",
    isIdentity: true,
    knowledgeNoteId: null,
    createdAt: "2026-06-01T09:00:00.000Z",
    ...over,
  };
}
