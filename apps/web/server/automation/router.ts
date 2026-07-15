import {
  automationDraftSchema,
  automationIdSchema,
  executeSchema,
  historyQuerySchema,
  previewSchema,
  updateAutomationSchema,
  type AutomationDraft,
} from "@myos/core/automation";
import { protectedProcedure, router } from "../trpc";
import * as service from "./service";
import { automationSignals } from "./signals";
import { portfolio } from "./statistics";

/**
 * Automation API (Sprint 3.4). A zod-validated tRPC surface over the deterministic
 * Automation Engine. protectedProcedure only. Actions dispatch to existing services;
 * automation never implements business logic.
 */
function prefs(ctx: {
  identity: {
    preferences: { timezone: string; preferredStartOfDay: string; preferredEndOfDay: string };
  };
}) {
  return {
    timezone: ctx.identity.preferences.timezone,
    preferredStartOfDay: ctx.identity.preferences.preferredStartOfDay,
    preferredEndOfDay: ctx.identity.preferences.preferredEndOfDay,
  };
}

export const automationRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    await service.seedBuiltins(ctx.db).catch(() => 0);
    return service.list(ctx.db);
  }),
  get: protectedProcedure
    .input(automationIdSchema)
    .query(({ ctx, input }) => service.get(ctx.db, input.id)),
  summary: protectedProcedure.query(({ ctx }) =>
    service.summary(ctx.db, ctx.identity.preferences.timezone),
  ),
  statisticsPortfolio: protectedProcedure.query(({ ctx }) =>
    portfolio(ctx.db, ctx.identity.preferences.timezone),
  ),
  signals: protectedProcedure.query(({ ctx }) =>
    automationSignals(ctx.db, ctx.identity.preferences.timezone),
  ),
  history: protectedProcedure
    .input(historyQuerySchema)
    .query(({ ctx, input }) => service.history(ctx.db, input.ruleId, input.limit ?? 100)),
  statistics: protectedProcedure
    .input(automationIdSchema)
    .query(({ ctx, input }) => service.statistics(ctx.db, input.id)),

  create: protectedProcedure
    .input(automationDraftSchema)
    .mutation(({ ctx, input }) => service.create(ctx.db, input as AutomationDraft)),
  update: protectedProcedure.input(updateAutomationSchema).mutation(({ ctx, input }) => {
    const { id, ...patch } = input;
    return service.update(ctx.db, id, patch as Partial<AutomationDraft>);
  }),
  delete: protectedProcedure
    .input(automationIdSchema)
    .mutation(({ ctx, input }) => service.remove(ctx.db, input.id)),
  enable: protectedProcedure
    .input(automationIdSchema)
    .mutation(({ ctx, input }) => service.enable(ctx.db, input.id)),
  disable: protectedProcedure
    .input(automationIdSchema)
    .mutation(({ ctx, input }) => service.disable(ctx.db, input.id)),
  execute: protectedProcedure
    .input(executeSchema)
    .mutation(({ ctx, input }) =>
      service.execute(ctx.db, input.id, prefs(ctx), input.payload ?? {}),
    ),
  validate: protectedProcedure
    .input(automationDraftSchema)
    .mutation(({ ctx, input }) => service.validate(ctx.db, input as AutomationDraft)),
  preview: protectedProcedure.input(previewSchema).mutation(({ ctx, input }) =>
    service.preview(
      ctx.db,
      {
        ...(input.id ? { id: input.id } : {}),
        ...(input.draft ? { draft: input.draft as AutomationDraft } : {}),
        ...(input.payload ? { payload: input.payload } : {}),
      },
      prefs(ctx),
    ),
  ),
});
