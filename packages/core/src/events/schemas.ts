/**
 * Event Intelligence — zod schemas (Sprint 6.1). Validate the event + signal shapes crossing the
 * server boundary. Pure — no IO.
 */
import { z } from "zod";

export const eventSourceSchema = z.enum([
  "planner",
  "calendar",
  "task",
  "health",
  "timeline",
  "knowledge",
  "resource",
  "goal",
  "finance",
  "notification",
  "focus",
  "project",
  "journal",
  "automation",
  "external",
]);

export const domainEventSchema = z.object({
  id: z.string(),
  source: eventSourceSchema,
  kind: z.string().min(1),
  at: z.string(),
  payload: z.record(z.unknown()).default({}),
  ref: z.object({ module: z.string(), id: z.string(), label: z.string().optional() }).optional(),
});

export const signalCategorySchema = z.enum([
  "productivity",
  "planning",
  "health",
  "learning",
  "projects",
  "finance",
  "resources",
  "deadlines",
  "opportunities",
  "risks",
  "automation",
  "environment",
  "external",
]);

export const contextWindowSchema = z.enum(["current", "today", "tomorrow", "week", "long_term"]);

export const signalSubscriptionSchema = z.object({
  categories: z.array(signalCategorySchema).default([]),
  minLevel: z
    .enum(["silent", "suggestion", "reminder", "important", "critical"])
    .default("suggestion"),
});
export type SignalSubscription = z.infer<typeof signalSubscriptionSchema>;
