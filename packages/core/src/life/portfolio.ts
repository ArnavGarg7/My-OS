import type {
  DoctorAppointment,
  Habit,
  HabitCompletion,
  Injury,
  LifePortfolio,
  Medication,
  Routine,
  VisionItem,
  WorkoutSession,
} from "./types";
import { activeHabits, averageConsistency, bestStreak } from "./habits";
import { activeRoutines } from "./routines";
import { activeMedications } from "./medication";
import { activeInjuries } from "./injuries";
import { upcomingAppointments } from "./appointments";
import { sessionsThisWeek } from "./workouts";

/**
 * Life portfolio (Sprint 4.2). A fully DERIVED snapshot of the personal life platform —
 * never stored. Pure.
 */
export interface PortfolioInput {
  habits: Habit[];
  completions: HabitCompletion[];
  routines: Routine[];
  medications: Medication[];
  injuries: Injury[];
  appointments: DoctorAppointment[];
  workouts: WorkoutSession[];
  vision: VisionItem[];
  now: Date;
}

export function buildPortfolio(input: PortfolioInput): LifePortfolio {
  return {
    activeHabits: activeHabits(input.habits).length,
    bestStreak: bestStreak(input.habits, input.completions, input.now),
    averageConsistency: averageConsistency(input.habits, input.completions, input.now),
    activeRoutines: activeRoutines(input.routines).length,
    activeMedications: activeMedications(input.medications).length,
    workoutsThisWeek: sessionsThisWeek(input.workouts, input.now).length,
    activeInjuries: activeInjuries(input.injuries).length,
    upcomingAppointments: upcomingAppointments(input.appointments, input.now).length,
    visionItems: input.vision.length,
    identityStatements: input.vision.filter((v) => v.isIdentity).length,
  };
}
