import "server-only";
import { randomUUID } from "node:crypto";
import { createLifeEngine } from "@myos/core/life";
import type {
  BodyMeasurement,
  DoctorAppointment,
  Habit,
  Injury,
  Medication,
  PersonalReview,
  Supplement,
  VisionItem,
  WorkoutSession,
} from "@myos/core/life";
import type { Database } from "@myos/db";
import * as repo from "./repository";

/**
 * LifeService (Sprint 4.2). Bridges the pure LifeEngine with persistence. The engine
 * mints habits/routines with parsed steps; the service persists them and logs
 * completions. No feature logic beyond composition — every derivation lives in core.
 */
const engine = createLifeEngine(() => randomUUID());

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

/* Habits */
export function listHabits(db: Database) {
  return repo.listHabits(db);
}
export function createHabit(db: Database, input: Parameters<typeof engine.makeHabit>[0]) {
  return repo.insertHabit(db, engine.makeHabit(input));
}
export function updateHabit(db: Database, id: string, patch: Partial<Habit>) {
  return repo.updateHabitRow(db, id, patch);
}
export async function completeHabit(db: Database, id: string, date?: string) {
  return repo.insertCompletion(db, id, date ?? today());
}

/* Routines */
export function listRoutines(db: Database) {
  return repo.listRoutines(db);
}
export function createRoutine(db: Database, input: Parameters<typeof engine.makeRoutine>[0]) {
  return repo.insertRoutine(db, engine.makeRoutine(input));
}
export async function completeRoutine(
  db: Database,
  id: string,
  completedSteps?: number,
  date?: string,
) {
  const routine = await repo.getRoutine(db, id);
  if (!routine) return null;
  const total = routine.steps.length;
  return repo.completeRoutine(db, id, completedSteps ?? total, total, date ?? today());
}

/* Medications / Supplements */
export function listMedications(db: Database) {
  return repo.listMedications(db);
}
export function createMedication(db: Database, v: Partial<Medication> & { name: string }) {
  return repo.insertMedication(db, v);
}
export function logMedication(db: Database, id: string) {
  return repo.logMedication(db, id);
}
export function listSupplements(db: Database) {
  return repo.listSupplements(db);
}
export function createSupplement(db: Database, v: Partial<Supplement> & { name: string }) {
  return repo.insertSupplement(db, v);
}

/* Appointments / Injuries */
export function listAppointments(db: Database) {
  return repo.listAppointments(db);
}
export function createAppointment(
  db: Database,
  v: Partial<DoctorAppointment> & { title: string; date: string },
) {
  return repo.insertAppointment(db, v);
}
export function updateAppointment(db: Database, id: string, patch: Partial<DoctorAppointment>) {
  return repo.updateAppointmentRow(db, id, patch);
}
export function listInjuries(db: Database) {
  return repo.listInjuries(db);
}
export function createInjury(db: Database, v: Partial<Injury> & { name: string }) {
  return repo.insertInjury(db, v);
}
export function updateInjury(db: Database, id: string, patch: Partial<Injury>) {
  return repo.updateInjuryRow(db, id, patch);
}

/* Workouts / Body */
export function listWorkouts(db: Database) {
  return repo.listWorkouts(db);
}
export function logWorkout(db: Database, v: Partial<WorkoutSession>) {
  return repo.insertWorkout(db, { ...v, date: v.date ?? today() });
}
export function listBody(db: Database) {
  return repo.listBody(db);
}
export function logBody(db: Database, v: Partial<BodyMeasurement>) {
  return repo.insertBody(db, { ...v, date: v.date ?? today() });
}

/* Reviews / Vision */
export function listReviews(db: Database) {
  return repo.listReviews(db);
}
export function createReview(
  db: Database,
  v: Omit<PersonalReview, "id" | "createdAt" | "periodStart"> & { periodStart?: string },
) {
  return repo.insertReview(db, { ...v, periodStart: v.periodStart ?? today() });
}
export function listVision(db: Database) {
  return repo.listVision(db);
}
export function createVision(db: Database, v: Omit<VisionItem, "id" | "createdAt">) {
  return repo.insertVision(db, v);
}
