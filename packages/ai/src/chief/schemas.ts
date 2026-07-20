/**
 * Chief zod schemas (Sprint 5.2). Validate the ChiefContext the server composer builds, plus the
 * feedback and profile-edit inputs. Pure — no IO.
 */
import { z } from "zod";

export const entityRefSchema = z.object({ module: z.string(), id: z.string() });

export const personalProfileSchema = z.object({
  deepWorkPreferredStartHour: z.number().int().min(0).max(23),
  deepWorkMinBlockMinutes: z.number().int().min(15).max(180),
  studyPreferredStartHour: z.number().int().min(0).max(23),
  workoutPreferredHour: z.number().int().min(0).max(23),
  meetingPreference: z.enum(["batch", "spread"]),
  planningStyle: z.enum(["detailed", "flexible"]),
  communicationStyle: z.enum(["concise", "warm"]),
  notificationStyle: z.enum(["proactive", "quiet"]),
  breakFrequencyMinutes: z.number().int().min(15).max(120),
  reviewStyle: z.enum(["daily", "weekly"]),
  decisionStyle: z.enum(["fast", "deliberate"]),
  revision: z.number().int().nonnegative(),
});

export const focusWindowSchema = z.object({
  start: z.string(),
  end: z.string(),
  minutes: z.number().int().nonnegative(),
  uninterrupted: z.boolean(),
});

export const disruptionSchema = z.object({
  kind: z.enum([
    "missed_block",
    "cancelled_event",
    "delay",
    "low_energy",
    "focus_lost",
    "free_time",
    "manual",
  ]),
  detail: z.string(),
  minutes: z.number().int().optional(),
  ref: entityRefSchema.optional(),
});

export const chiefContextSchema = z.object({
  now: z.string(),
  timezone: z.string(),
  greetingName: z.string(),
  readiness: z.number().nullable(),
  energy: z.enum(["low", "medium", "high"]).nullable(),
  mission: z.object({
    title: z.string(),
    priorities: z.array(
      z.object({ rank: z.number().int(), label: z.string(), ref: entityRefSchema.optional() }),
    ),
  }),
  focusWindows: z.array(focusWindowSchema),
  planBlocks: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      start: z.string(),
      end: z.string(),
      type: z.string(),
      status: z.string(),
      locked: z.boolean(),
      taskId: z.string().nullable().optional(),
    }),
  ),
  calendarEvents: z.array(
    z.object({ id: z.string(), title: z.string(), start: z.string(), end: z.string() }),
  ),
  tasks: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      score: z.number(),
      dueAt: z.string().nullable().optional(),
      estimateMin: z.number().nullable().optional(),
      area: z.string().nullable().optional(),
      status: z.string(),
    }),
  ),
  goals: z.array(
    z.object({ id: z.string(), title: z.string(), progress: z.number(), staleDays: z.number() }),
  ),
  activeFocusSession: z
    .object({ startedAt: z.string(), plannedMinutes: z.number().int() })
    .nullable(),
  pendingDecisions: z.number().int().nonnegative(),
  disruptions: z.array(disruptionSchema),
  profile: personalProfileSchema,
});

export const feedbackSchema = z.object({
  recommendationId: z.string(),
  outcome: z.enum(["accepted", "modified", "rejected", "ignored"]),
  note: z.string().optional(),
});
