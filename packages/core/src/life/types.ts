import type {
  ExerciseType,
  HabitFrequency,
  InjuryStatus,
  MedicationFrequency,
  RecommendationLevel,
  ReviewFrequency,
  RoutineStatus,
  RoutineType,
  VisionCategory,
} from "./constants";

/**
 * Personal Life Platform types (Sprint 4.2). Pure domain shapes. Derived views
 * (streaks, adherence, readiness, portfolio, statistics, correlations) are computed,
 * never stored.
 */

/* ── Habits ────────────────────────────────────────────────────────────── */
export interface Habit {
  id: string;
  name: string;
  description: string;
  frequency: HabitFrequency;
  /** For weekly: target completions/week. For custom: interval in days. */
  target: number;
  /** ISO days-of-week (0=Sun..6=Sat) the habit applies to, empty = every applicable day. */
  daysOfWeek: number[];
  goalId: string | null;
  knowledgeNoteId: string | null;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface HabitCompletion {
  id: string;
  habitId: string;
  date: string; // YYYY-MM-DD
  completedAt: string; // ISO
}

export interface StreakInfo {
  current: number;
  longest: number;
  consistency: number; // percent over the window
  completionRate: number; // percent of due days completed
  missedDays: number;
  recoveryScore: number; // how well recent misses were recovered (0..100)
  atRisk: boolean;
}

/* ── Routines ──────────────────────────────────────────────────────────── */
export interface RoutineStep {
  id: string;
  routineId: string;
  order: number;
  title: string;
  durationMinutes: number;
  linkedTaskId: string | null;
  linkedHabitId: string | null;
}

export interface Routine {
  id: string;
  name: string;
  type: RoutineType;
  status: RoutineStatus;
  /** Preferred start time (HH:MM) for materialization; null = flexible. */
  startTime: string | null;
  steps: RoutineStep[];
  knowledgeNoteId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RoutineCompletion {
  id: string;
  routineId: string;
  date: string;
  completedSteps: number;
  totalSteps: number;
  completedAt: string;
}

/* ── Advanced Health ───────────────────────────────────────────────────── */
export interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: MedicationFrequency;
  timeOfDay: string | null; // HH:MM
  active: boolean;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface MedicationLog {
  id: string;
  medicationId: string;
  takenAt: string; // ISO
}

export interface Supplement {
  id: string;
  name: string;
  dosage: string;
  frequency: MedicationFrequency;
  active: boolean;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface DoctorAppointment {
  id: string;
  title: string;
  provider: string;
  date: string; // YYYY-MM-DD
  time: string | null; // HH:MM
  location: string;
  notes: string;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Injury {
  id: string;
  name: string;
  bodyPart: string;
  status: InjuryStatus;
  severity: number; // 1..5
  notes: string;
  startedAt: string;
  healedAt: string | null;
  knowledgeNoteId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Exercise {
  id: string;
  name: string;
  type: ExerciseType;
  muscleGroups: string[];
  notes: string;
  createdAt: string;
}

export interface WorkoutProgram {
  id: string;
  name: string;
  description: string;
  exerciseIds: string[];
  active: boolean;
  knowledgeNoteId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface WorkoutSet {
  exerciseId: string;
  reps: number;
  weight: number;
  durationMinutes: number;
  intensity: number; // RPE-like 1..10
}

export interface WorkoutSession {
  id: string;
  programId: string | null;
  date: string;
  sets: WorkoutSet[];
  perceivedExertion: number; // 1..10
  recoveryNotes: string;
  createdAt: string;
}

export interface BodyMeasurement {
  id: string;
  date: string;
  weightKg: number | null;
  bodyFatPercentage: number | null;
  restingHeartRate: number | null;
  bloodPressureSystolic: number | null;
  bloodPressureDiastolic: number | null;
  notes: string;
  createdAt: string;
}

/* ── Personal Growth ───────────────────────────────────────────────────── */
export interface PersonalReview {
  id: string;
  frequency: ReviewFrequency;
  periodStart: string; // YYYY-MM-DD
  wins: string[];
  lessons: string[];
  focusNext: string[];
  notes: string;
  knowledgeNoteId: string | null;
  createdAt: string;
}

/** Vision / identity extension over Goals. */
export interface VisionItem {
  id: string;
  category: VisionCategory;
  statement: string;
  isIdentity: boolean;
  knowledgeNoteId: string | null;
  createdAt: string;
}

/* ── Derived views ─────────────────────────────────────────────────────── */
export interface Readiness {
  score: number; // 0..100
  recovery: number; // 0..100
  risk: number; // 0..100 (higher = more risk)
  trainingRecommendation: RecommendationLevel;
  workRecommendation: RecommendationLevel;
  studyRecommendation: RecommendationLevel;
  components: { label: string; value: number }[];
}

export interface TrainingLoad {
  weeklyVolume: number;
  sessions: number;
  averageIntensity: number;
  high: boolean;
}

export interface Correlation {
  pair: string;
  coefficient: number; // -1..1
  samples: number;
  strength: "none" | "weak" | "moderate" | "strong";
}

export interface LifePortfolio {
  activeHabits: number;
  bestStreak: number;
  averageConsistency: number;
  activeRoutines: number;
  activeMedications: number;
  workoutsThisWeek: number;
  activeInjuries: number;
  upcomingAppointments: number;
  visionItems: number;
  identityStatements: number;
}

export interface LifeStatistics {
  habitConsistency: number;
  routineAdherence: number;
  workoutLoad: number;
  recovery: number;
  growthVelocity: number;
  lifeBalance: number; // spread across vision categories
  identityProgress: number;
}

export interface LifeSignals {
  habitStreakAtRisk: boolean;
  routineSkipped: boolean;
  lowRecovery: boolean;
  doctorAppointmentSoon: boolean;
  medicationDue: boolean;
  trainingLoadHigh: boolean;
  identityGoalStalled: boolean;
}

export interface LifeSummary {
  activeHabits: number;
  habitsCompletedToday: number;
  bestStreak: number;
  readiness: number;
  medicationDue: boolean;
  nextRoutine: string | null;
  workoutsThisWeek: number;
}
