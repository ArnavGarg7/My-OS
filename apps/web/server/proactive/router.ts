import "server-only";
import { z } from "zod";
import { protectedProcedure, router } from "../trpc";
import * as service from "./service";

/**
 * Proactive OS router (Stage 6). Read surface for proactive interventions + the on/off
 * control + an explicit evaluate trigger. Interventions themselves are notifications
 * (reusing the Sprint 3.3 platform) — their lifecycle (dismiss/complete/snooze) runs
 * through the existing `notification.*` mutations, so this router adds no duplicate
 * lifecycle. `tz`/day-prefs come from the identity on the context.
 */
export const proactiveRouter = router({
  /** The single most important active intervention — for the Command Center card. */
  forCommandCenter: protectedProcedure.query(({ ctx }) => service.forCommandCenter(ctx.db)),
  /** All active proactive interventions — the notification center's "OS Interventions" group. */
  interventions: protectedProcedure.query(({ ctx }) => service.interventions(ctx.db)),
  /** Proactive master switch. */
  settings: protectedProcedure.query(({ ctx }) => service.settings(ctx.db)),
  setEnabled: protectedProcedure
    .input(z.object({ enabled: z.boolean() }))
    .mutation(({ ctx, input }) => service.setProactiveEnabled(ctx.db, input.enabled)),
  /** Run one proactive evaluation cycle now (also invoked by the worker/internal route). */
  evaluate: protectedProcedure.mutation(({ ctx }) =>
    service.evaluate(ctx.db, ctx.identity.preferences.timezone, {
      preferredStartOfDay: ctx.identity.preferences.preferredStartOfDay,
      preferredEndOfDay: ctx.identity.preferences.preferredEndOfDay,
    }),
  ),
});
