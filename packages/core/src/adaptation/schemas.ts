/**
 * Adaptation zod schemas (Sprint 6.5). Validate the mutation inputs crossing the server boundary:
 * submitting feedback, editing/disabling a learned preference, and setting a category's learning
 * policy. Pure — no IO. Read queries need no input.
 */
import { z } from "zod";

export const feedbackTypeSchema = z.enum([
  "helpful",
  "not_helpful",
  "wrong_timing",
  "incorrect_assumption",
  "ignore_similar",
  "excellent",
]);

export const submitFeedbackSchema = z.object({
  proposalId: z.string(),
  subject: z.string(),
  type: feedbackTypeSchema,
});

export const profileCategorySchema = z.enum([
  "productivity",
  "learning",
  "health",
  "meetings",
  "focus",
  "planning",
  "communication",
  "automation",
  "notifications",
  "decision_style",
]);

export const editPreferenceSchema = z.object({
  key: z.string(),
  /** Optional new value (string or number). */
  value: z.union([z.string(), z.number()]).optional(),
  /** Optional enable/disable toggle. */
  enabled: z.boolean().optional(),
});

export const learningModeSchema = z.enum(["manual", "suggested", "automatic"]);

export const setPolicySchema = z.object({
  category: profileCategorySchema,
  mode: learningModeSchema,
});

export const reviewRangeSchema = z.object({
  periodStart: z.string(),
  periodEnd: z.string(),
});
