/**
 * Assistant zod schemas (Sprint 5.3). Validate the chat input, feedback and settings shapes crossing
 * the server boundary. Pure — no IO.
 */
import { z } from "zod";

export const conversationModeSchema = z.enum([
  "chief",
  "planning",
  "review",
  "research",
  "search",
  "editing",
  "automation",
  "troubleshooting",
]);

export const chatInputSchema = z.object({
  conversationId: z.string().optional(),
  message: z.string().min(1).max(4000),
  mode: conversationModeSchema.optional(),
});
export type ChatInput = z.infer<typeof chatInputSchema>;

export const conversationFeedbackSchema = z.object({
  messageId: z.string(),
  outcome: z.enum(["helpful", "unhelpful", "wrong", "accepted_proposal", "rejected_proposal"]),
  note: z.string().optional(),
});
export type ConversationFeedback = z.infer<typeof conversationFeedbackSchema>;

export const aiSettingsSchema = z.object({
  tier: z.enum(["best", "economy", "local"]),
  softDailyUsd: z.number().nonnegative(),
  hardDailyUsd: z.number().nonnegative(),
  journalInContext: z.boolean(),
  localOnly: z.boolean(),
  memoryProposalsEnabled: z.boolean(),
});
