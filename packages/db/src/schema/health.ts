/**
 * Health schema (Sprint 2.9). The personal wellness store — one denormalized
 * daily row plus append-style logs for workouts, sleep, hydration, nutrition and
 * body measurements. Derived analytics (sleep score, recovery, readiness) are
 * NOT stored; they are recomputed on read. Single user (05 §0: no user_id).
 */
import { relations } from "drizzle-orm";
import {
  boolean,
  date,
  doublePrecision,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
// `energy_level` already exists (created by the Today schema); reuse it.
import { energyLevel } from "./today";

export const workoutType = pgEnum("workout_type", [
  "strength",
  "cardio",
  "mobility",
  "sport",
  "walk",
  "other",
]);
export const mealType = pgEnum("meal_type", ["breakfast", "lunch", "dinner", "snack"]);
export const recoveryStatus = pgEnum("recovery_status", [
  "recovered",
  "recovering",
  "fatigued",
  "overtrained",
]);

/** One denormalized wellness row per day. Scores are cached snapshots only. */
export const healthDaily = pgTable("health_daily", {
  date: date("date", { mode: "string" }).primaryKey(),
  energyLevel: energyLevel("energy_level"),
  mood: text("mood"),
  stress: integer("stress"),
  sleepScore: integer("sleep_score"),
  readinessScore: integer("readiness_score"),
  waterMl: integer("water_ml").notNull().default(0),
  calories: integer("calories").notNull().default(0),
  protein: doublePrecision("protein").notNull().default(0),
  carbs: doublePrecision("carbs").notNull().default(0),
  fat: doublePrecision("fat").notNull().default(0),
  steps: integer("steps").notNull().default(0),
  weight: doublePrecision("weight"),
  bodyFat: doublePrecision("body_fat"),
  notes: text("notes").notNull().default(""),
});

export const workouts = pgTable("workouts", {
  id: uuid("id").defaultRandom().primaryKey(),
  type: workoutType("type").notNull().default("other"),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull(),
  endedAt: timestamp("ended_at", { withTimezone: true }),
  durationMinutes: integer("duration_minutes").notNull().default(0),
  volume: doublePrecision("volume").notNull().default(0),
  caloriesBurned: integer("calories_burned").notNull().default(0),
  rpe: integer("rpe"),
  completed: boolean("completed").notNull().default(false),
});

export const sleepSessions = pgTable("sleep_sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  bedTime: timestamp("bed_time", { withTimezone: true }).notNull(),
  wakeTime: timestamp("wake_time", { withTimezone: true }).notNull(),
  durationMinutes: integer("duration_minutes").notNull().default(0),
  quality: integer("quality").notNull().default(70),
});

export const hydrationLogs = pgTable("hydration_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  time: timestamp("time", { withTimezone: true }).notNull().defaultNow(),
  amountMl: integer("amount_ml").notNull(),
  source: text("source").notNull().default("water"),
});

export const nutritionLogs = pgTable("nutrition_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  meal: mealType("meal").notNull(),
  calories: integer("calories").notNull().default(0),
  protein: doublePrecision("protein").notNull().default(0),
  carbs: doublePrecision("carbs").notNull().default(0),
  fat: doublePrecision("fat").notNull().default(0),
  loggedAt: timestamp("logged_at", { withTimezone: true }).notNull().defaultNow(),
});

export const bodyMeasurements = pgTable("body_measurements", {
  id: uuid("id").defaultRandom().primaryKey(),
  weight: doublePrecision("weight"),
  bodyFat: doublePrecision("body_fat"),
  muscleMass: doublePrecision("muscle_mass"),
  waist: doublePrecision("waist"),
  recordedAt: timestamp("recorded_at", { withTimezone: true }).notNull().defaultNow(),
});

export const healthDailyRelations = relations(healthDaily, () => ({}));

export type HealthDailyRow = typeof healthDaily.$inferSelect;
export type HealthDailyInsert = typeof healthDaily.$inferInsert;
export type WorkoutRow = typeof workouts.$inferSelect;
export type SleepSessionRow = typeof sleepSessions.$inferSelect;
export type HydrationLogRow = typeof hydrationLogs.$inferSelect;
export type NutritionLogRow = typeof nutritionLogs.$inferSelect;
export type BodyMeasurementRow = typeof bodyMeasurements.$inferSelect;
