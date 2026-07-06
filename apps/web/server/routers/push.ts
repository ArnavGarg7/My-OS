import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { pushSubscriptions } from "@myos/db/schema";
import { protectedProcedure, router } from "../trpc";

/**
 * Push subscription storage (Sprint 1.7). Device registration only — stores /
 * removes Web Push subscriptions for the current user. There is NO server-side
 * push sender in this sprint.
 */
const subscriptionInput = z.object({
  endpoint: z.string().url(),
  keys: z.object({ p256dh: z.string().min(1), auth: z.string().min(1) }),
  userAgent: z.string().max(512).optional(),
});

export const pushRouter = router({
  /** Upsert the current device's subscription (keyed by endpoint). */
  register: protectedProcedure.input(subscriptionInput).mutation(async ({ ctx, input }) => {
    await ctx.db
      .insert(pushSubscriptions)
      .values({
        userId: ctx.identity.id,
        endpoint: input.endpoint,
        p256dh: input.keys.p256dh,
        auth: input.keys.auth,
        ...(input.userAgent ? { userAgent: input.userAgent } : {}),
      })
      .onConflictDoUpdate({
        target: pushSubscriptions.endpoint,
        set: {
          userId: ctx.identity.id,
          p256dh: input.keys.p256dh,
          auth: input.keys.auth,
          updatedAt: new Date(),
        },
      });
    return { ok: true };
  }),

  /** Remove a device subscription by endpoint. */
  unregister: protectedProcedure
    .input(z.object({ endpoint: z.string().url() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .delete(pushSubscriptions)
        .where(
          and(
            eq(pushSubscriptions.endpoint, input.endpoint),
            eq(pushSubscriptions.userId, ctx.identity.id),
          ),
        );
      return { ok: true };
    }),

  /** Count registered devices for the current user (diagnostics). */
  count: protectedProcedure.query(async ({ ctx }) => {
    const rows = await ctx.db
      .select({ endpoint: pushSubscriptions.endpoint })
      .from(pushSubscriptions)
      .where(eq(pushSubscriptions.userId, ctx.identity.id));
    return { count: rows.length };
  }),
});
