import "server-only";
import { z } from "zod";
import { protectedProcedure, router } from "../trpc";
import * as service from "./service";
import * as diagnostics from "./diagnostics";

/**
 * AI platform router (Sprint 5.1 + 5.4). Infrastructure + diagnostics endpoints only — no end-user
 * AI is exposed here (the assistant lives on `assistant.*`). 5.1 shipped provider health, config,
 * prompts, context/tools/structured/generation demos, telemetry, evals and cost. Sprint 5.4 adds the
 * AI Developer Console: observability traces, prompt lifecycle + rollback, provider benchmarking,
 * performance budgets, cost intelligence, reliability recovery, security diagnostics and end-to-end
 * validation. Every procedure is protected and deterministic (Local tier).
 */
function greetingName(ctx: { identity: { email: string | null } }): string {
  const local = (ctx.identity.email ?? "").split("@")[0] ?? "there";
  return local.charAt(0).toUpperCase() + local.slice(1);
}

export const aiRouter = router({
  health: protectedProcedure.query(({ ctx }) => service.providerHealth(ctx.db)),
  providers: protectedProcedure.query(() => service.listProviders()),
  prompts: protectedProcedure.query(() => service.prompts()),
  syncPrompts: protectedProcedure.mutation(({ ctx }) => service.syncPrompts(ctx.db)),
  context: protectedProcedure
    .input(
      z.object({
        feature: z.string().default("assistant"),
        data: z.record(z.unknown()).optional(),
      }),
    )
    .query(({ input }) => service.contextDemo(input)),
  tools: protectedProcedure.query(() => service.toolsDemo()),
  structured: protectedProcedure.query(() => service.structuredDemo()),
  generate: protectedProcedure
    .input(z.object({ feature: z.string().default("infra-demo"), prompt: z.string().min(1) }))
    .mutation(({ input }) => service.generationDemo(input)),
  telemetry: protectedProcedure.query(() => service.telemetry()),
  eval: protectedProcedure.mutation(({ ctx }) => service.runEval(ctx.db)),
  cost: protectedProcedure.query(() => service.cost()),

  // ── Sprint 5.4: AI Developer Console ─────────────────────────────────────
  overview: protectedProcedure.query(() => diagnostics.overview()),
  promptRegistry: protectedProcedure.query(() => diagnostics.promptRegistry()),
  promptInspect: protectedProcedure
    .input(z.object({ name: z.string() }))
    .query(({ input }) => diagnostics.promptInspect(input.name)),
  promptCompare: protectedProcedure
    .input(z.object({ name: z.string() }))
    .query(({ input }) => diagnostics.promptCompare(input.name)),
  promptRollback: protectedProcedure
    .input(z.object({ name: z.string(), version: z.string() }))
    .mutation(({ ctx, input }) => diagnostics.rollbackPrompt(ctx.db, input.name, input.version)),
  traces: protectedProcedure.query(({ ctx }) => diagnostics.traces(ctx.db)),
  performance: protectedProcedure.query(({ ctx }) => diagnostics.performance(ctx.db)),
  costIntelligence: protectedProcedure.query(() => diagnostics.cost()),
  benchmarks: protectedProcedure.mutation(({ ctx }) =>
    diagnostics.runBenchmarks(ctx.db, ctx.identity.preferences.timezone, greetingName(ctx)),
  ),
  reliability: protectedProcedure.mutation(({ ctx }) => diagnostics.reliability(ctx.db)),
  security: protectedProcedure
    .input(z.object({ probe: z.string().optional() }).optional())
    .query(({ ctx, input }) => diagnostics.security(ctx.db, input?.probe)),
  evaluations: protectedProcedure.mutation(({ ctx }) =>
    diagnostics.evaluations(ctx.db, ctx.identity.preferences.timezone, greetingName(ctx)),
  ),
});
