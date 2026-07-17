import "server-only";
import type {
  BodyMeasurementRow,
  DoctorAppointmentRow,
  HabitCompletionRow,
  InjuryRow,
  LifeBodyMeasurementRow,
  LifeHabitRow,
  MedicationLogRow,
  MedicationRow,
  PersonalReviewRow,
  RoutineCompletionRow,
  RoutineRow,
  RoutineStepRow,
  SupplementRow,
  VisionItemRow,
  WorkoutSessionRow,
} from "@myos/db/schema";
import type {
  BodyMeasurement,
  DoctorAppointment,
  Habit,
  HabitCompletion,
  Injury,
  Medication,
  MedicationLog,
  PersonalReview,
  Routine,
  RoutineCompletion,
  Supplement,
  VisionItem,
  WorkoutSession,
} from "@myos/core/life";

/**
 * Life mappers (Sprint 4.2). Convert persisted rows into the pure-domain shapes. Derived
 * views (streaks/readiness/portfolio/statistics/correlations) are computed in core.
 */
const iso = (d: Date | null): string | null => (d ? d.toISOString() : null);

export function habitRowToHabit(row: LifeHabitRow): Habit {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    frequency: row.frequency,
    target: row.target,
    daysOfWeek: row.daysOfWeek,
    goalId: row.goalId,
    knowledgeNoteId: row.knowledgeNoteId,
    archived: row.archived,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function completionRowToCompletion(row: HabitCompletionRow): HabitCompletion {
  return {
    id: row.id,
    habitId: row.habitId,
    date: row.date,
    completedAt: row.completedAt.toISOString(),
  };
}

export function routineRowToRoutine(row: RoutineRow, steps: RoutineStepRow[]): Routine {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    status: row.status,
    startTime: row.startTime,
    steps: steps
      .sort((a, b) => a.stepOrder - b.stepOrder)
      .map((s) => ({
        id: s.id,
        routineId: s.routineId,
        order: s.stepOrder,
        title: s.title,
        durationMinutes: s.durationMinutes,
        linkedTaskId: s.linkedTaskId,
        linkedHabitId: s.linkedHabitId,
      })),
    knowledgeNoteId: row.knowledgeNoteId,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function routineCompletionRowTo(row: RoutineCompletionRow): RoutineCompletion {
  return {
    id: row.id,
    routineId: row.routineId,
    date: row.date,
    completedSteps: row.completedSteps,
    totalSteps: row.totalSteps,
    completedAt: row.completedAt.toISOString(),
  };
}

export function medicationRowTo(row: MedicationRow): Medication {
  return {
    id: row.id,
    name: row.name,
    dosage: row.dosage,
    frequency: row.frequency,
    timeOfDay: row.timeOfDay,
    active: row.active,
    notes: row.notes,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function medicationLogRowTo(row: MedicationLogRow): MedicationLog {
  return { id: row.id, medicationId: row.medicationId, takenAt: row.takenAt.toISOString() };
}

export function supplementRowTo(row: SupplementRow): Supplement {
  return {
    id: row.id,
    name: row.name,
    dosage: row.dosage,
    frequency: row.frequency,
    active: row.active,
    notes: row.notes,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function appointmentRowTo(row: DoctorAppointmentRow): DoctorAppointment {
  return {
    id: row.id,
    title: row.title,
    provider: row.provider,
    date: row.date,
    time: row.time,
    location: row.location,
    notes: row.notes,
    completed: row.completed,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function injuryRowTo(row: InjuryRow): Injury {
  return {
    id: row.id,
    name: row.name,
    bodyPart: row.bodyPart,
    status: row.status,
    severity: row.severity,
    notes: row.notes,
    startedAt: row.startedAt.toISOString(),
    healedAt: iso(row.healedAt),
    knowledgeNoteId: row.knowledgeNoteId,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function bodyRowTo(row: LifeBodyMeasurementRow | BodyMeasurementRow): BodyMeasurement {
  // Only life_body_measurements is used by the life domain (has the full shape).
  const r = row as LifeBodyMeasurementRow;
  return {
    id: r.id,
    date: r.date,
    weightKg: r.weightKg,
    bodyFatPercentage: r.bodyFatPercentage,
    restingHeartRate: r.restingHeartRate,
    bloodPressureSystolic: r.bloodPressureSystolic,
    bloodPressureDiastolic: r.bloodPressureDiastolic,
    notes: r.notes,
    createdAt: r.createdAt.toISOString(),
  };
}

export function workoutRowTo(row: WorkoutSessionRow): WorkoutSession {
  return {
    id: row.id,
    programId: row.programId,
    date: row.date,
    sets: row.sets,
    perceivedExertion: row.perceivedExertion,
    recoveryNotes: row.recoveryNotes,
    createdAt: row.createdAt.toISOString(),
  };
}

export function reviewRowTo(row: PersonalReviewRow): PersonalReview {
  return {
    id: row.id,
    frequency: row.frequency,
    periodStart: row.periodStart,
    wins: row.wins,
    lessons: row.lessons,
    focusNext: row.focusNext,
    notes: row.notes,
    knowledgeNoteId: row.knowledgeNoteId,
    createdAt: row.createdAt.toISOString(),
  };
}

export function visionRowTo(row: VisionItemRow): VisionItem {
  return {
    id: row.id,
    category: row.category as VisionItem["category"],
    statement: row.statement,
    isIdentity: row.isIdentity,
    knowledgeNoteId: row.knowledgeNoteId,
    createdAt: row.createdAt.toISOString(),
  };
}
