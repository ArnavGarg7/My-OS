import { z } from "zod";
import {
  EXERCISE_TYPES,
  HABIT_FREQUENCIES,
  INJURY_STATUSES,
  MEDICATION_FREQUENCIES,
  REVIEW_FREQUENCIES,
  ROUTINE_TYPES,
  VISION_CATEGORIES,
} from "./constants";

/**
 * Personal Life Platform zod schemas (Sprint 4.2). Validate the tRPC surface. Every
 * derived view (readiness/portfolio/statistics/correlations) is a query over these.
 */
const name = z.string().min(1).max(200);
const id = z.string().uuid();
const dateStr = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const timeStr = z.string().regex(/^\d{2}:\d{2}$/);

export const habitInputSchema = z.object({
  name,
  description: z.string().max(2000).optional(),
  frequency: z.enum(HABIT_FREQUENCIES).optional(),
  target: z.number().int().min(1).max(100).optional(),
  daysOfWeek: z.array(z.number().int().min(0).max(6)).max(7).optional(),
  goalId: id.nullable().optional(),
  knowledgeNoteId: id.nullable().optional(),
});
export const updateHabitSchema = habitInputSchema.partial().extend({
  id,
  archived: z.boolean().optional(),
});
export const completeHabitSchema = z.object({ id, date: dateStr.optional() });

export const routineStepSchema = z.object({
  title: name,
  durationMinutes: z.number().int().min(0).max(600).optional(),
  linkedTaskId: id.nullable().optional(),
  linkedHabitId: id.nullable().optional(),
});
export const routineInputSchema = z.object({
  name,
  type: z.enum(ROUTINE_TYPES).optional(),
  startTime: timeStr.nullable().optional(),
  steps: z.array(routineStepSchema).max(50).optional(),
  knowledgeNoteId: id.nullable().optional(),
});
export const updateRoutineSchema = routineInputSchema.partial().extend({ id });
export const completeRoutineSchema = z.object({
  id,
  completedSteps: z.number().int().min(0).optional(),
  date: dateStr.optional(),
});

export const medicationInputSchema = z.object({
  name,
  dosage: z.string().max(100).optional(),
  frequency: z.enum(MEDICATION_FREQUENCIES).optional(),
  timeOfDay: timeStr.nullable().optional(),
  notes: z.string().max(2000).optional(),
});
export const updateMedicationSchema = medicationInputSchema.partial().extend({
  id,
  active: z.boolean().optional(),
});
export const logMedicationSchema = z.object({ id });

export const supplementInputSchema = z.object({
  name,
  dosage: z.string().max(100).optional(),
  frequency: z.enum(MEDICATION_FREQUENCIES).optional(),
  notes: z.string().max(2000).optional(),
});

export const appointmentInputSchema = z.object({
  title: name,
  provider: z.string().max(200).optional(),
  date: dateStr,
  time: timeStr.nullable().optional(),
  location: z.string().max(300).optional(),
  notes: z.string().max(2000).optional(),
});
export const updateAppointmentSchema = appointmentInputSchema.partial().extend({
  id,
  completed: z.boolean().optional(),
});

export const injuryInputSchema = z.object({
  name,
  bodyPart: z.string().max(100).optional(),
  status: z.enum(INJURY_STATUSES).optional(),
  severity: z.number().int().min(1).max(5).optional(),
  notes: z.string().max(2000).optional(),
});
export const updateInjurySchema = injuryInputSchema.partial().extend({ id });

export const exerciseInputSchema = z.object({
  name,
  type: z.enum(EXERCISE_TYPES).optional(),
  muscleGroups: z.array(z.string().max(50)).max(20).optional(),
  notes: z.string().max(1000).optional(),
});
export const programInputSchema = z.object({
  name,
  description: z.string().max(2000).optional(),
  exerciseIds: z.array(id).max(100).optional(),
});
export const workoutSetSchema = z.object({
  exerciseId: id,
  reps: z.number().int().min(0).max(1000).optional(),
  weight: z.number().min(0).max(10000).optional(),
  durationMinutes: z.number().min(0).max(600).optional(),
  intensity: z.number().int().min(1).max(10).optional(),
});
export const workoutInputSchema = z.object({
  programId: id.nullable().optional(),
  sets: z.array(workoutSetSchema).max(100).optional(),
  perceivedExertion: z.number().int().min(1).max(10).optional(),
  recoveryNotes: z.string().max(2000).optional(),
});

export const bodyInputSchema = z.object({
  weightKg: z.number().min(0).max(1000).nullable().optional(),
  bodyFatPercentage: z.number().min(0).max(100).nullable().optional(),
  restingHeartRate: z.number().int().min(20).max(250).nullable().optional(),
  bloodPressureSystolic: z.number().int().min(50).max(300).nullable().optional(),
  bloodPressureDiastolic: z.number().int().min(30).max(200).nullable().optional(),
  notes: z.string().max(1000).optional(),
});

export const reviewInputSchema = z.object({
  frequency: z.enum(REVIEW_FREQUENCIES),
  wins: z.array(z.string().max(500)).max(50).optional(),
  lessons: z.array(z.string().max(500)).max(50).optional(),
  focusNext: z.array(z.string().max(500)).max(50).optional(),
  notes: z.string().max(5000).optional(),
  knowledgeNoteId: id.nullable().optional(),
});

export const visionInputSchema = z.object({
  category: z.enum(VISION_CATEGORIES),
  statement: z.string().min(1).max(500),
  isIdentity: z.boolean().optional(),
  knowledgeNoteId: id.nullable().optional(),
});

export const idSchema = z.object({ id });
