import "server-only";
import { z } from "zod";
import { chatInputSchema, conversationFeedbackSchema } from "@myos/ai/assistant";
import { protectedProcedure, router } from "../trpc";
import * as service from "./service";

/**
 * Conversational Chief router (Sprint 5.3). Grounded, tool-driven conversation; mutations return
 * proposals (never applied here); provider keys are never exposed. `tz` + greeting name come from
 * the identity on the context.
 */
function name(ctx: { identity: { email: string | null } }): string {
  const local = (ctx.identity.email ?? "").split("@")[0] ?? "there";
  return local.charAt(0).toUpperCase() + local.slice(1);
}

export const assistantRouter = router({
  chat: protectedProcedure
    .input(chatInputSchema)
    .mutation(({ ctx, input }) =>
      service.chat(ctx.db, ctx.identity.preferences.timezone, name(ctx), input),
    ),
  history: protectedProcedure
    .input(z.object({ conversationId: z.string().optional() }))
    .query(({ ctx, input }) => service.history(ctx.db, input.conversationId)),
  providers: protectedProcedure.query(() => service.providers()),
  settings: protectedProcedure.query(() => service.settings()),
  feedback: protectedProcedure
    .input(conversationFeedbackSchema)
    .mutation(({ ctx, input }) => service.feedback(ctx.db, input)),
});
