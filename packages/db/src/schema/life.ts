/**
 * Personal Life Platform schema (Sprint 4.2, Phase 4). The deterministic life-management
 * layer: habits + completions, routines + steps, advanced health (medication/supplements/
 * appointments/injuries/exercise library/workout programs/body measurements) and personal
 * reviews. Extends — never replaces — Health (2.9) and Goals (2.12); those tables gain a
 * few columns (see migration 0024). Derived views (streaks/readiness/portfolio/statistics/
 * correlations) are NOT stored. Single user (05 §0: no user_id).
 */
import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  real,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

// Named `life_habit_frequency` to avoid colliding with the Goal engine's `habit_frequency`
// enum (2.12), which lacks "custom". The two habit systems are independent.
export const lifeHabitFrequency = pgEnum("life_habit_frequency", [
  "daily",
  "weekly",
  "monthly",
  "custom",
]);
export const routineType = pgEnum("routine_type", [
  "morning",
  "evening",
  "workout",
  "study",
  "travel",
  "weekend",
  "custom",
]);
export const routineStatus = pgEnum("routine_status", ["active", "paused", "archived"]);
export const exerciseType = pgEnum("exercise_type", [
  "strength",
  "cardio",
  "mobility",
  "sport",
  "recovery",
]);
export const injuryStatus = pgEnum("injury_status", ["active", "recovering", "healed"]);
export const medicationFrequency = pgEnum("medication_frequency", [
  "once_daily",
  "twice_daily",
  "thrice_daily",
  "weekly",
  "as_needed",
]);
export const reviewFrequency = pgEnum("review_frequency", [
  "weekly",
  "monthly",
  "quarterly",
  "annual",
]);

// Named `life_habits` to avoid colliding with the Goal engine's `habits` table (2.12);
// the two habit systems are deliberately independent (spec: "separate from goals").
export const lifeHabits = pgTable(
  "life_habits",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    description: text("description").notNull().default(""),
    frequency: lifeHabitFrequency("frequency").notNull().default("daily"),
    target: integer("target").notNull().default(1),
    daysOfWeek: jsonb("days_of_week").$type<number[]>().notNull().default([]),
    goalId: uuid("goal_id"),
    knowledgeNoteId: uuid("knowledge_note_id"),
    archived: boolean("archived").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({ byArchived: index("life_habits_archived_idx").on(t.archived) }),
);

export const habitCompletions = pgTable(
  "habit_completions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    habitId: uuid("habit_id")
      .notNull()
      .references(() => lifeHabits.id, { onDelete: "cascade" }),
    date: date("date", { mode: "string" }).notNull(),
    completedAt: timestamp("completed_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    byHabit: index("habit_completions_habit_idx").on(t.habitId),
    byDate: index("habit_completions_date_idx").on(t.date),
  }),
);

export const routines = pgTable("routines", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  type: routineType("type").notNull().default("custom"),
  status: routineStatus("status").notNull().default("active"),
  startTime: text("start_time"),
  knowledgeNoteId: uuid("knowledge_note_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const routineSteps = pgTable(
  "routine_steps",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    routineId: uuid("routine_id")
      .notNull()
      .references(() => routines.id, { onDelete: "cascade" }),
    stepOrder: integer("step_order").notNull().default(0),
    title: text("title").notNull(),
    durationMinutes: integer("duration_minutes").notNull().default(5),
    linkedTaskId: uuid("linked_task_id"),
    linkedHabitId: uuid("linked_habit_id"),
  },
  (t) => ({ byRoutine: index("routine_steps_routine_idx").on(t.routineId) }),
);

export const routineCompletions = pgTable(
  "routine_completions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    routineId: uuid("routine_id")
      .notNull()
      .references(() => routines.id, { onDelete: "cascade" }),
    date: date("date", { mode: "string" }).notNull(),
    completedSteps: integer("completed_steps").notNull().default(0),
    totalSteps: integer("total_steps").notNull().default(0),
    completedAt: timestamp("completed_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({ byRoutine: index("routine_completions_routine_idx").on(t.routineId) }),
);

export const medications = pgTable("medications", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  dosage: text("dosage").notNull().default(""),
  frequency: medicationFrequency("frequency").notNull().default("once_daily"),
  timeOfDay: text("time_of_day"),
  active: boolean("active").notNull().default(true),
  notes: text("notes").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const medicationLogs = pgTable(
  "medication_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    medicationId: uuid("medication_id")
      .notNull()
      .references(() => medications.id, { onDelete: "cascade" }),
    takenAt: timestamp("taken_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({ byMed: index("medication_logs_med_idx").on(t.medicationId) }),
);

export const supplements = pgTable("supplements", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  dosage: text("dosage").notNull().default(""),
  frequency: medicationFrequency("frequency").notNull().default("once_daily"),
  active: boolean("active").notNull().default(true),
  notes: text("notes").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const doctorAppointments = pgTable(
  "doctor_appointments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    title: text("title").notNull(),
    provider: text("provider").notNull().default(""),
    date: date("date", { mode: "string" }).notNull(),
    time: text("time"),
    location: text("location").notNull().default(""),
    notes: text("notes").notNull().default(""),
    completed: boolean("completed").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({ byDate: index("doctor_appointments_date_idx").on(t.date) }),
);

export const injuryLog = pgTable("injury_log", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  bodyPart: text("body_part").notNull().default(""),
  status: injuryStatus("status").notNull().default("active"),
  severity: integer("severity").notNull().default(1),
  notes: text("notes").notNull().default(""),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
  healedAt: timestamp("healed_at", { withTimezone: true }),
  knowledgeNoteId: uuid("knowledge_note_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const exerciseLibrary = pgTable("exercise_library", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  type: exerciseType("type").notNull().default("strength"),
  muscleGroups: jsonb("muscle_groups").$type<string[]>().notNull().default([]),
  notes: text("notes").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const workoutPrograms = pgTable("workout_programs", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  exerciseIds: jsonb("exercise_ids").$type<string[]>().notNull().default([]),
  active: boolean("active").notNull().default(true),
  knowledgeNoteId: uuid("knowledge_note_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// Named `life_body_measurements` to avoid colliding with the Health engine's
// `body_measurements` (2.9); this richer table adds BP + body-fat + RHR for the platform.
export const lifeBodyMeasurements = pgTable(
  "life_body_measurements",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    date: date("date", { mode: "string" }).notNull(),
    weightKg: real("weight_kg"),
    bodyFatPercentage: real("body_fat_percentage"),
    restingHeartRate: integer("resting_heart_rate"),
    bloodPressureSystolic: integer("blood_pressure_systolic"),
    bloodPressureDiastolic: integer("blood_pressure_diastolic"),
    notes: text("notes").notNull().default(""),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({ byDate: index("life_body_measurements_date_idx").on(t.date) }),
);

export const personalReviews = pgTable("personal_reviews", {
  id: uuid("id").defaultRandom().primaryKey(),
  frequency: reviewFrequency("frequency").notNull(),
  periodStart: date("period_start", { mode: "string" }).notNull(),
  wins: jsonb("wins").$type<string[]>().notNull().default([]),
  lessons: jsonb("lessons").$type<string[]>().notNull().default([]),
  focusNext: jsonb("focus_next").$type<string[]>().notNull().default([]),
  notes: text("notes").notNull().default(""),
  knowledgeNoteId: uuid("knowledge_note_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Vision / identity statements (personal growth extension over Goals). */
export const visionItems = pgTable("vision_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  category: text("category").notNull(),
  statement: text("statement").notNull(),
  isIdentity: boolean("is_identity").notNull().default(false),
  knowledgeNoteId: uuid("knowledge_note_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Workout sessions (logged training). */
export const workoutSessions = pgTable(
  "workout_sessions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    programId: uuid("program_id"),
    date: date("date", { mode: "string" }).notNull(),
    sets: jsonb("sets")
      .$type<
        {
          exerciseId: string;
          reps: number;
          weight: number;
          durationMinutes: number;
          intensity: number;
        }[]
      >()
      .notNull()
      .default([]),
    perceivedExertion: integer("perceived_exertion").notNull().default(5),
    recoveryNotes: text("recovery_notes").notNull().default(""),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({ byDate: index("workout_sessions_date_idx").on(t.date) }),
);

export type LifeHabitRow = typeof lifeHabits.$inferSelect;
export type HabitCompletionRow = typeof habitCompletions.$inferSelect;
export type RoutineRow = typeof routines.$inferSelect;
export type RoutineStepRow = typeof routineSteps.$inferSelect;
export type RoutineCompletionRow = typeof routineCompletions.$inferSelect;
export type MedicationRow = typeof medications.$inferSelect;
export type MedicationLogRow = typeof medicationLogs.$inferSelect;
export type SupplementRow = typeof supplements.$inferSelect;
export type DoctorAppointmentRow = typeof doctorAppointments.$inferSelect;
export type InjuryRow = typeof injuryLog.$inferSelect;
export type ExerciseRow = typeof exerciseLibrary.$inferSelect;
export type WorkoutProgramRow = typeof workoutPrograms.$inferSelect;
export type LifeBodyMeasurementRow = typeof lifeBodyMeasurements.$inferSelect;
export type PersonalReviewRow = typeof personalReviews.$inferSelect;
export type VisionItemRow = typeof visionItems.$inferSelect;
export type WorkoutSessionRow = typeof workoutSessions.$inferSelect;
