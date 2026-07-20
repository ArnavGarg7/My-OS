import "server-only";
import { z } from "zod";
import type { Database } from "@myos/db";
import { getModel, MODELS, TIER_ROUTES, CAPABILITIES } from "@myos/ai/config";
import { listPrompts } from "@myos/ai/prompts";
import { buildProfile, allocateBudget, FEATURE_PROFILES } from "@myos/ai/context";
import { executeTool } from "@myos/ai/tools";
import { validateStructured } from "@myos/ai/structured";
import { summarizeSpend, guardCost } from "@myos/ai/cost";
import { runSuite, type EvalFixture } from "@myos/ai/evals";
import { getAiEngine } from "./engine";
import { recordEvalRun, recordProviderHealth, seedPromptVersions } from "./repository";

/**
 * AI platform service (Sprint 5.1). Thin façade the router calls. It composes the deterministic
 * platform primitives (@myos/ai) with persistence — no business logic, no assistant. Every method
 * exercises one part of the pipeline so the infra console can verify it end-to-end.
 */

/** Provider health — probe every provider, persist the snapshot, return the states. */
export async function providerHealth(db: Database) {
  const statuses = await getAiEngine().health();
  await recordProviderHealth(
    db,
    statuses.map((s) => ({
      provider: s.provider,
      state: s.state,
      detail: s.detail,
      checkedAt: s.checkedAt,
    })),
  );
  return statuses;
}

/** Static provider + routing configuration (models, tiers, capabilities). Pure. */
export function listProviders() {
  const models = Object.values(MODELS).map((m) => ({
    id: m.id,
    provider: m.provider,
    label: m.label,
    capabilities: m.capabilities,
    inputCostPerMTok: m.inputCostPerMTok,
    outputCostPerMTok: m.outputCostPerMTok,
    structuredOutputs: m.structuredOutputs,
    toolCalling: m.toolCalling,
  }));
  return { models, tiers: TIER_ROUTES, capabilities: CAPABILITIES, tier: getAiEngine().tier };
}

/** The versioned prompt registry. */
export function prompts() {
  return listPrompts();
}

/** Seed prompt versions into the DB (idempotent). */
export async function syncPrompts(db: Database) {
  const inserted = await seedPromptVersions(
    db,
    listPrompts().map((p) => ({
      name: p.name,
      version: p.version,
      owner: p.owner,
      compatibleModels: p.compatibleModels,
      outputSchema: p.outputSchema,
    })),
  );
  return { total: listPrompts().length, inserted };
}

/** Context builder + budget demo: build a feature profile from sample data and allocate the budget. */
export function contextDemo(input: {
  feature?: string | undefined;
  data?: Record<string, unknown> | undefined;
}) {
  const feature = input.feature && input.feature in FEATURE_PROFILES ? input.feature : "assistant";
  const data = input.data ?? {
    profile: { tz: "Asia/Kolkata", dayBounds: "06:00-23:00" },
    season: { kind: "focus", daysRemaining: 12 },
    today: { date: "2026-07-18", energy: "high", blocks: 4 },
    memories: [{ kind: "preference", content: "no deep work after 9pm" }],
  };
  const snapshots = buildProfile(feature, data);
  const budget = allocateBudget(snapshots);
  return { feature, snapshots, budget };
}

/** Tool registry list + a demonstration execution through the pipeline. */
export async function toolsDemo() {
  const engine = getAiEngine();
  const list = engine.tools.list();
  const demo = await executeTool(
    engine.tools,
    "query_tasks",
    { limit: 5 },
    { granted: ["read:tasks"] },
  );
  return { tools: list, demo };
}

/** Structured-output validation demo (valid + repaired + invalid samples). */
export function structuredDemo() {
  const schema = z.object({ title: z.string(), priority: z.number() });
  return {
    valid: validateStructured('{"title":"Ship 5.1","priority":1}', schema),
    repaired: validateStructured('```json\n{"title":"Ship 5.1","priority":1}\n```', schema),
    invalid: validateStructured("not json", schema),
  };
}

/** Streaming/generation demo: run a request through the gateway and return text + telemetry. */
export async function generationDemo(input: { feature?: string | undefined; prompt: string }) {
  const engine = getAiEngine();
  const res = await engine.run({
    feature: input.feature ?? "infra-demo",
    messages: [{ role: "user", content: input.prompt }],
  });
  const events = engine.telemetry.all();
  return { response: res, lastEvent: events[events.length - 1] ?? null };
}

/** Telemetry aggregate over the in-process collector. */
export function telemetry() {
  const engine = getAiEngine();
  return { aggregate: engine.telemetry.aggregate(), recent: engine.telemetry.all().slice(-20) };
}

/** Run the structured-output eval suite, persist the run, and return the result. */
export async function runEval(db: Database) {
  const schema = z.object({ ok: z.boolean() });
  const fixtures: EvalFixture<string, string>[] = [
    {
      name: "valid json",
      input: '{"ok":true}',
      assert: (o) => ({ pass: validateStructured(o, schema).ok, detail: o }),
    },
    {
      name: "fenced json repairs",
      input: '```json\n{"ok":true}\n```',
      assert: (o) => ({ pass: validateStructured(o, schema).ok, detail: o }),
    },
    {
      name: "garbage rejected",
      input: "xyz",
      assert: (o) => ({ pass: !validateStructured(o, schema).ok, detail: o }),
    },
  ];
  const result = await runSuite("structured", fixtures, (i) => i);
  await recordEvalRun(db, result);
  return result;
}

/** Cost summary from telemetry, with the current guard verdict. */
export function cost() {
  const engine = getAiEngine();
  const spend = summarizeSpend(engine.telemetry.all());
  return { spend, guard: guardCost(spend.totalUsd) };
}

export { getModel };
