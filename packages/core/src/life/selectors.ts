import type {
  DoctorAppointment,
  Habit,
  HabitCompletion,
  LifeSignals,
  LifeSummary,
  Medication,
  MedicationLog,
  Routine,
  RoutineCompletion,
  WorkoutSession,
} from "./types";
import { atRiskHabits, bestStreak, completedToday, activeHabits } from "./habits";
import { nextRoutine, skippedRoutines } from "./routines";
import { dueMedications } from "./medication";
import { soonAppointments } from "./appointments";
import { sessionsThisWeek, trainingLoad } from "./workouts";

/**
 * Life selectors (Sprint 4.2). Deterministic signals for the Decision engine + a compact
 * summary for status bar / Morning / Tomorrow / context panel. Pure.
 */
export interface SignalInput {
  habits: Habit[];
  completions: HabitCompletion[];
  routines: Routine[];
  routineCompletions: RoutineCompletion[];
  medications: Medication[];
  medicationLogs: MedicationLog[];
  appointments: DoctorAppointment[];
  workouts: WorkoutSession[];
  recovery: number; // 0..100 from readiness
  identityGoalStalled: boolean;
  now: Date;
}

export function computeSignals(input: SignalInput): LifeSignals {
  return {
    habitStreakAtRisk: atRiskHabits(input.habits, input.completions, input.now).length > 0,
    routineSkipped: skippedRoutines(input.routines, input.routineCompletions, input.now).length > 0,
    lowRecovery: input.recovery < 40,
    doctorAppointmentSoon: soonAppointments(input.appointments, input.now).length > 0,
    medicationDue: dueMedications(input.medications, input.medicationLogs, input.now).length > 0,
    trainingLoadHigh: trainingLoad(input.workouts, input.now).high,
    identityGoalStalled: input.identityGoalStalled,
  };
}

export interface SummaryInput {
  habits: Habit[];
  completions: HabitCompletion[];
  routines: Routine[];
  routineCompletions: RoutineCompletion[];
  medications: Medication[];
  medicationLogs: MedicationLog[];
  workouts: WorkoutSession[];
  readiness: number; // 0..100
  now: Date;
}

export function buildSummary(input: SummaryInput): LifeSummary {
  const next = nextRoutine(input.routines, input.routineCompletions, input.now);
  return {
    activeHabits: activeHabits(input.habits).length,
    habitsCompletedToday: completedToday(input.habits, input.completions, input.now).length,
    bestStreak: bestStreak(input.habits, input.completions, input.now),
    readiness: Math.round(input.readiness),
    medicationDue: dueMedications(input.medications, input.medicationLogs, input.now).length > 0,
    nextRoutine: next?.name ?? null,
    workoutsThisWeek: sessionsThisWeek(input.workouts, input.now).length,
  };
}
