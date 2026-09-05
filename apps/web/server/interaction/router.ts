import "server-only";
import { z } from "zod";
import { protectedProcedure, router } from "../trpc";
import * as service from "./service";

/**
 * Interaction router (Stage 9). The universal text/voice entry point: `interpret` returns a
 * previewable, grounded interpretation (never auto-executes); `execute` runs a confirmed
 * intent through the existing capabilities. The intent is validated server-side (AI output
 * is never trusted); targets are re-resolved in the service. `name`/day-prefs come from the
 * identity on the context.
 */
const intentSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("create_task"),
    title: z.string().min(1).max(500),
    dueAt: z.string().nullable(),
    priority: z.string(),
    estimatedMinutes: z.number().nullable(),
  }),
  z.object({ kind: z.literal("capture_inbox"), content: z.string().min(1).max(20000) }),
  z.object({
    kind: z.literal("start_focus"),
    taskQuery: z.string().nullable(),
    durationMinutes: z.number().int().min(1).max(600).nullable(),
  }),
  z.object({ kind: z.literal("query_calendar"), range: z.enum(["today", "tomorrow"]) }),
  z.object({ kind: z.literal("recommend") }),
  z.object({ kind: z.literal("workload") }),
  z.object({ kind: z.literal("weather"), when: z.enum(["today", "tomorrow"]) }),
  z.object({ kind: z.literal("unknown"), text: z.string() }),
]);

function prefsOf(ctx: {
  identity: {
    preferences: {
      preferredStartOfDay: string;
      preferredEndOfDay: string;
      displayName: string | null;
    };
  };
}) {
  return {
    name: ctx.identity.preferences.displayName ?? "there",
    prefs: {
      preferredStartOfDay: ctx.identity.preferences.preferredStartOfDay,
      preferredEndOfDay: ctx.identity.preferences.preferredEndOfDay,
    },
  };
}

export const interactionRouter = router({
  interpret: protectedProcedure
    .input(
      z.object({ text: z.string().max(1000), location: z.string().max(120).nullable().optional() }),
    )
    .mutation(({ ctx, input }) => {
      const { name, prefs } = prefsOf(ctx);
      return service.interpret(ctx.db, ctx.identity.preferences.timezone, {
        text: input.text,
        name,
        prefs,
        location: input.location ?? null,
      });
    }),
  execute: protectedProcedure
    .input(
      z.object({
        intent: intentSchema,
        taskId: z.string().uuid().nullable().optional(),
        location: z.string().max(120).nullable().optional(),
      }),
    )
    .mutation(({ ctx, input }) =>
      service.execute(ctx.db, ctx.identity.preferences.timezone, input.intent, {
        taskId: input.taskId ?? null,
        location: input.location ?? null,
        name: prefsOf(ctx).name,
      }),
    ),
});
