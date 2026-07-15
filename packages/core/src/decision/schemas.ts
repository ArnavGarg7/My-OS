import { z } from "zod";
import { DEFER_OPTIONS } from "./constants";

/**
 * Decision input validation (Sprint 2.3). Shared by tRPC + the service.
 */
export const decisionIdSchema = z.string().uuid();
export const deferOptionSchema = z.enum(DEFER_OPTIONS);

export const decisionActionSchema = z.object({ id: decisionIdSchema });

export const deferDecisionSchema = z.object({
  id: decisionIdSchema,
  option: deferOptionSchema,
  customUntil: z.string().datetime().optional(),
});

export const listDecisionsSchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  limit: z.number().int().min(1).max(200).optional(),
});

export const decisionNoteSchema = z.object({
  id: decisionIdSchema,
  content: z.string().trim().min(1).max(2000),
});

export type DecisionActionInput = z.infer<typeof decisionActionSchema>;
export type DeferDecisionInput = z.infer<typeof deferDecisionSchema>;
export type ListDecisionsInput = z.infer<typeof listDecisionsSchema>;
export type DecisionNoteInput = z.infer<typeof decisionNoteSchema>;
