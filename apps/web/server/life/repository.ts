import "server-only";
import { desc, eq, inArray } from "drizzle-orm";
import type { Database } from "@myos/db";
import {
  bodyMeasurements as healthBody,
  doctorAppointments,
  habitCompletions,
  injuryLog,
  lifeBodyMeasurements,
  lifeHabits,
  medicationLogs,
  medications,
  personalReviews,
  routineCompletions,
  routineSteps,
  routines,
  supplements,
  visionItems,
  workoutSessions,
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
import * as m from "./mapper";

/**
 * Life persistence (Sprint 4.2). CRUD over the life tables. Every derived view
 * (streaks/readiness/portfolio/statistics/correlations) is computed by core from these
 * reads — nothing derived is stored. (Suppress unused import used only for typing.)
 */
void healthBody;

/* ── Habits ─────────────────────────────────────────────────────────────── */
export async function listHabits(db: Database): Promise<Habit[]> {
  const rows = await db.select().from(lifeHabits).orderBy(desc(lifeHabits.updatedAt));
  return rows.map(m.habitRowToHabit);
}
export async function getHabit(db: Database, id: string): Promise<Habit | null> {
  const [row] = await db.select().from(lifeHabits).where(eq(lifeHabits.id, id)).limit(1);
  return row ? m.habitRowToHabit(row) : null;
}
export async function insertHabit(db: Database, h: Habit): Promise<Habit> {
  const [row] = await db
    .insert(lifeHabits)
    .values({
      name: h.name,
      description: h.description,
      frequency: h.frequency,
      target: h.target,
      daysOfWeek: h.daysOfWeek,
      goalId: h.goalId,
      knowledgeNoteId: h.knowledgeNoteId,
    })
    .returning();
  return m.habitRowToHabit(row!);
}
export async function updateHabitRow(
  db: Database,
  id: string,
  patch: Partial<Habit>,
): Promise<Habit> {
  const set: Record<string, unknown> = { updatedAt: new Date() };
  for (const k of [
    "name",
    "description",
    "frequency",
    "target",
    "daysOfWeek",
    "goalId",
    "knowledgeNoteId",
    "archived",
  ] as const) {
    if (patch[k] !== undefined) set[k] = patch[k];
  }
  const [row] = await db.update(lifeHabits).set(set).where(eq(lifeHabits.id, id)).returning();
  return m.habitRowToHabit(row!);
}
export async function listCompletions(db: Database): Promise<HabitCompletion[]> {
  const rows = await db.select().from(habitCompletions);
  return rows.map(m.completionRowToCompletion);
}
export async function insertCompletion(
  db: Database,
  habitId: string,
  date: string,
): Promise<HabitCompletion> {
  const [row] = await db.insert(habitCompletions).values({ habitId, date }).returning();
  return m.completionRowToCompletion(row!);
}

/* ── Routines ───────────────────────────────────────────────────────────── */
export async function listRoutines(db: Database): Promise<Routine[]> {
  const rows = await db.select().from(routines).orderBy(desc(routines.updatedAt));
  if (rows.length === 0) return [];
  const steps = await db
    .select()
    .from(routineSteps)
    .where(
      inArray(
        routineSteps.routineId,
        rows.map((r) => r.id),
      ),
    );
  const byRoutine = new Map<string, typeof steps>();
  for (const s of steps) {
    const list = byRoutine.get(s.routineId) ?? [];
    list.push(s);
    byRoutine.set(s.routineId, list);
  }
  return rows.map((r) => m.routineRowToRoutine(r, byRoutine.get(r.id) ?? []));
}
export async function getRoutine(db: Database, id: string): Promise<Routine | null> {
  const [row] = await db.select().from(routines).where(eq(routines.id, id)).limit(1);
  if (!row) return null;
  const steps = await db.select().from(routineSteps).where(eq(routineSteps.routineId, id));
  return m.routineRowToRoutine(row, steps);
}
export async function insertRoutine(db: Database, r: Routine): Promise<Routine> {
  const [row] = await db
    .insert(routines)
    .values({ name: r.name, type: r.type, status: r.status, startTime: r.startTime })
    .returning();
  if (r.steps.length > 0) {
    await db.insert(routineSteps).values(
      r.steps.map((s, i) => ({
        routineId: row!.id,
        stepOrder: i,
        title: s.title,
        durationMinutes: s.durationMinutes,
        linkedTaskId: s.linkedTaskId,
        linkedHabitId: s.linkedHabitId,
      })),
    );
  }
  return (await getRoutine(db, row!.id))!;
}
export async function completeRoutine(
  db: Database,
  routineId: string,
  completedSteps: number,
  totalSteps: number,
  date: string,
): Promise<RoutineCompletion> {
  const [row] = await db
    .insert(routineCompletions)
    .values({ routineId, completedSteps, totalSteps, date })
    .returning();
  return m.routineCompletionRowTo(row!);
}
export async function listRoutineCompletions(db: Database): Promise<RoutineCompletion[]> {
  const rows = await db.select().from(routineCompletions);
  return rows.map(m.routineCompletionRowTo);
}

/* ── Medications / Supplements ──────────────────────────────────────────── */
export async function listMedications(db: Database): Promise<Medication[]> {
  return (await db.select().from(medications)).map(m.medicationRowTo);
}
export async function insertMedication(
  db: Database,
  v: Partial<Medication> & { name: string },
): Promise<Medication> {
  const [row] = await db
    .insert(medications)
    .values({
      name: v.name,
      dosage: v.dosage ?? "",
      frequency: v.frequency ?? "once_daily",
      timeOfDay: v.timeOfDay ?? null,
      notes: v.notes ?? "",
    })
    .returning();
  return m.medicationRowTo(row!);
}
export async function logMedication(db: Database, medicationId: string): Promise<MedicationLog> {
  const [row] = await db.insert(medicationLogs).values({ medicationId }).returning();
  return m.medicationLogRowTo(row!);
}
export async function listMedicationLogs(db: Database): Promise<MedicationLog[]> {
  return (await db.select().from(medicationLogs)).map(m.medicationLogRowTo);
}
export async function listSupplements(db: Database): Promise<Supplement[]> {
  return (await db.select().from(supplements)).map(m.supplementRowTo);
}
export async function insertSupplement(
  db: Database,
  v: Partial<Supplement> & { name: string },
): Promise<Supplement> {
  const [row] = await db
    .insert(supplements)
    .values({
      name: v.name,
      dosage: v.dosage ?? "",
      frequency: v.frequency ?? "once_daily",
      notes: v.notes ?? "",
    })
    .returning();
  return m.supplementRowTo(row!);
}

/* ── Appointments / Injuries ────────────────────────────────────────────── */
export async function listAppointments(db: Database): Promise<DoctorAppointment[]> {
  return (await db.select().from(doctorAppointments).orderBy(doctorAppointments.date)).map(
    m.appointmentRowTo,
  );
}
export async function insertAppointment(
  db: Database,
  v: Partial<DoctorAppointment> & { title: string; date: string },
): Promise<DoctorAppointment> {
  const [row] = await db
    .insert(doctorAppointments)
    .values({
      title: v.title,
      provider: v.provider ?? "",
      date: v.date,
      time: v.time ?? null,
      location: v.location ?? "",
      notes: v.notes ?? "",
    })
    .returning();
  return m.appointmentRowTo(row!);
}
export async function updateAppointmentRow(
  db: Database,
  id: string,
  patch: Partial<DoctorAppointment>,
): Promise<DoctorAppointment> {
  const set: Record<string, unknown> = { updatedAt: new Date() };
  for (const k of [
    "title",
    "provider",
    "date",
    "time",
    "location",
    "notes",
    "completed",
  ] as const) {
    if (patch[k] !== undefined) set[k] = patch[k];
  }
  const [row] = await db
    .update(doctorAppointments)
    .set(set)
    .where(eq(doctorAppointments.id, id))
    .returning();
  return m.appointmentRowTo(row!);
}
export async function listInjuries(db: Database): Promise<Injury[]> {
  return (await db.select().from(injuryLog).orderBy(desc(injuryLog.updatedAt))).map(m.injuryRowTo);
}
export async function insertInjury(
  db: Database,
  v: Partial<Injury> & { name: string },
): Promise<Injury> {
  const [row] = await db
    .insert(injuryLog)
    .values({
      name: v.name,
      bodyPart: v.bodyPart ?? "",
      status: v.status ?? "active",
      severity: v.severity ?? 1,
      notes: v.notes ?? "",
    })
    .returning();
  return m.injuryRowTo(row!);
}
export async function updateInjuryRow(
  db: Database,
  id: string,
  patch: Partial<Injury>,
): Promise<Injury> {
  const set: Record<string, unknown> = { updatedAt: new Date() };
  for (const k of ["name", "bodyPart", "status", "severity", "notes"] as const) {
    if (patch[k] !== undefined) set[k] = patch[k];
  }
  if (patch.status === "healed") set.healedAt = new Date();
  const [row] = await db.update(injuryLog).set(set).where(eq(injuryLog.id, id)).returning();
  return m.injuryRowTo(row!);
}

/* ── Workouts / Body ────────────────────────────────────────────────────── */
export async function listWorkouts(db: Database): Promise<WorkoutSession[]> {
  return (await db.select().from(workoutSessions).orderBy(desc(workoutSessions.date))).map(
    m.workoutRowTo,
  );
}
export async function insertWorkout(
  db: Database,
  v: Partial<WorkoutSession> & { date: string },
): Promise<WorkoutSession> {
  const [row] = await db
    .insert(workoutSessions)
    .values({
      programId: v.programId ?? null,
      date: v.date,
      sets: v.sets ?? [],
      perceivedExertion: v.perceivedExertion ?? 5,
      recoveryNotes: v.recoveryNotes ?? "",
    })
    .returning();
  return m.workoutRowTo(row!);
}
export async function listBody(db: Database): Promise<BodyMeasurement[]> {
  return (await db.select().from(lifeBodyMeasurements).orderBy(lifeBodyMeasurements.date)).map(
    m.bodyRowTo,
  );
}
export async function insertBody(
  db: Database,
  v: Partial<BodyMeasurement> & { date: string },
): Promise<BodyMeasurement> {
  const [row] = await db
    .insert(lifeBodyMeasurements)
    .values({
      date: v.date,
      weightKg: v.weightKg ?? null,
      bodyFatPercentage: v.bodyFatPercentage ?? null,
      restingHeartRate: v.restingHeartRate ?? null,
      bloodPressureSystolic: v.bloodPressureSystolic ?? null,
      bloodPressureDiastolic: v.bloodPressureDiastolic ?? null,
      notes: v.notes ?? "",
    })
    .returning();
  return m.bodyRowTo(row!);
}

/* ── Reviews / Vision ───────────────────────────────────────────────────── */
export async function listReviews(db: Database): Promise<PersonalReview[]> {
  return (await db.select().from(personalReviews).orderBy(desc(personalReviews.createdAt))).map(
    m.reviewRowTo,
  );
}
export async function insertReview(
  db: Database,
  v: Omit<PersonalReview, "id" | "createdAt">,
): Promise<PersonalReview> {
  const [row] = await db
    .insert(personalReviews)
    .values({
      frequency: v.frequency,
      periodStart: v.periodStart,
      wins: v.wins,
      lessons: v.lessons,
      focusNext: v.focusNext,
      notes: v.notes,
    })
    .returning();
  return m.reviewRowTo(row!);
}
export async function listVision(db: Database): Promise<VisionItem[]> {
  return (await db.select().from(visionItems).orderBy(desc(visionItems.createdAt))).map(
    m.visionRowTo,
  );
}
export async function insertVision(
  db: Database,
  v: Omit<VisionItem, "id" | "createdAt">,
): Promise<VisionItem> {
  const [row] = await db
    .insert(visionItems)
    .values({ category: v.category, statement: v.statement, isIdentity: v.isIdentity })
    .returning();
  return m.visionRowTo(row!);
}
