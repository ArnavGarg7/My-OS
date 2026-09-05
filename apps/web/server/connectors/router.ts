import "server-only";
import { z } from "zod";
import { connectSchema, disconnectSchema, syncInputSchema } from "@myos/core/connectors";
import { protectedProcedure, router } from "../trpc";
import * as service from "./service";
import { currentWeather } from "./weather";

/**
 * Connectors router (Sprint 6.4). The Connector Platform's surface: list/connect/disconnect external
 * services, run a sync (normalized events feed the SAME Event Engine), inspect health, permissions,
 * activity, sync history and metrics. **Credentials never cross this boundary** — connect takes a
 * secret in and returns only a non-secret hint; nothing returns plaintext. `tz` comes from identity.
 */
const accountInput = z.object({ accountId: z.string() });
const optionalAccount = z.object({ accountId: z.string().optional() }).optional();

export const connectorsRouter = router({
  list: protectedProcedure.query(({ ctx }) => service.list(ctx.db)),
  /** Stage 9: real current weather via OpenWeather (server-side key, honest states). */
  weather: protectedProcedure
    .input(z.object({ location: z.string().max(120).nullable().optional() }))
    .query(({ input }) => currentWeather(input.location ?? null)),
  connect: protectedProcedure
    .input(connectSchema)
    .mutation(({ ctx, input }) =>
      service.connect(ctx.db, input.providerId, input.label, input.secret),
    ),
  disconnect: protectedProcedure
    .input(disconnectSchema)
    .mutation(({ ctx, input }) => service.disconnect(ctx.db, input.accountId)),
  sync: protectedProcedure
    .input(syncInputSchema)
    .mutation(({ ctx, input }) =>
      service.sync(ctx.db, input.accountId, ctx.identity.preferences.timezone, input.trigger),
    ),
  health: protectedProcedure.query(({ ctx }) => service.health(ctx.db)),
  events: protectedProcedure
    .input(optionalAccount)
    .query(({ ctx, input }) => service.events(ctx.db, input?.accountId)),
  permissions: protectedProcedure
    .input(accountInput)
    .query(({ ctx, input }) => service.permissions(ctx.db, input.accountId)),
  syncHistory: protectedProcedure
    .input(optionalAccount)
    .query(({ ctx, input }) => service.syncHistory(ctx.db, input?.accountId)),
  metrics: protectedProcedure.query(({ ctx }) => service.metrics(ctx.db)),
  settings: protectedProcedure.query(({ ctx }) => service.settings(ctx.db)),
  /** Per-provider live availability (drives honest live/sample labelling). */
  capabilities: protectedProcedure.query(() => service.capabilities()),
  /** EXTERNAL → OS: normalized calendar activity from connected calendar accounts. */
  calendarActivity: protectedProcedure.query(({ ctx }) => service.calendarActivity(ctx.db)),
  /** MY OS → EXTERNAL: create a calendar event (honest not-connected without live creds). */
  createCalendarEvent: protectedProcedure
    .input(
      z.object({
        providerId: z.string().optional(),
        title: z.string().min(1).max(500),
        startAt: z.string().datetime(),
        endAt: z.string().datetime().optional(),
      }),
    )
    .mutation(({ ctx, input }) => service.createCalendarEvent(ctx.db, input)),
});
