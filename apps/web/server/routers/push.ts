import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { pushDevices, pushSubscriptions } from "@myos/db/schema";
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

  /**
   * Native FCM device tokens (Stage D). The Capacitor app registers its FCM registration token
   * here after the user grants notification permission; the server-side FCM sender targets these
   * to deliver push while the app is closed. Keyed by token so a re-register is idempotent and a
   * rotated token simply inserts a fresh row (stale ones are pruned on send).
   */
  registerDevice: protectedProcedure
    .input(
      z.object({
        token: z.string().min(1).max(4096),
        platform: z.enum(["android", "ios", "web"]).default("android"),
        userAgent: z.string().max(512).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .insert(pushDevices)
        .values({
          userId: ctx.identity.id,
          token: input.token,
          platform: input.platform,
          ...(input.userAgent ? { userAgent: input.userAgent } : {}),
        })
        .onConflictDoUpdate({
          target: pushDevices.token,
          set: {
            userId: ctx.identity.id,
            platform: input.platform,
            updatedAt: new Date(),
            lastSeenAt: new Date(),
          },
        });
      return { ok: true };
    }),

  /** Remove a native device token (on sign-out or permission revoke). */
  unregisterDevice: protectedProcedure
    .input(z.object({ token: z.string().min(1).max(4096) }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .delete(pushDevices)
        .where(and(eq(pushDevices.token, input.token), eq(pushDevices.userId, ctx.identity.id)));
      return { ok: true };
    }),

  /** Count registered native devices for the current user (diagnostics). */
  deviceCount: protectedProcedure.query(async ({ ctx }) => {
    const rows = await ctx.db
      .select({ token: pushDevices.token })
      .from(pushDevices)
      .where(eq(pushDevices.userId, ctx.identity.id));
    return { count: rows.length };
  }),
});
