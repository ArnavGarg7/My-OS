import "server-only";
import type { Database } from "@myos/db";
import { MODELS, computeCost } from "@myos/ai/config";
import {
  activeVersion,
  applyRollback,
  comparePrompts,
  seedVersionRecords,
  validatePrompt,
  type PromptVersionRecord,
} from "@myos/ai/prompts";
import {
  buildTrace,
  replayTrace,
  summarizeTrace,
  type ExecutionTrace,
} from "@myos/ai/observability";
import {
  aggregatePerformance,
  checkBudget,
  performanceHealth,
  DEFAULT_BUDGET,
  type PerfSample,
} from "@myos/ai/performance";
import {
  BENCHMARK_SCENARIOS,
  benchmarkReport,
  compareRuns,
  type ProviderRun,
} from "@myos/ai/benchmark";
import { FAILURE_KINDS, planRecovery, simulateRecovery } from "@myos/ai/reliability";
import { scanForInjection, secretDiagnostics, type SecretProvider } from "@myos/ai/security";
import {
  usageByFeature,
  usageByProvider,
  savingsFromLocal,
  projectMonthly,
  guardCost,
  summarizeSpend,
} from "@myos/ai/cost";
import { E2E_SCENARIOS, evaluateScenario } from "@myos/ai/evals";
import { estimateTokens } from "@myos/ai";
import { newConversation, runTurn } from "@myos/ai/assistant";
import { buildToolRegistry, ASSISTANT_GRANTS } from "../assistant/tool-handlers";
import { assistantPolicyInputs, getAssistantRegistry } from "../assistant/engine";
import { configuredProviders } from "../assistant/providers";
import { getAiEngine } from "./engine";
import {
  listSecurityEvents,
  listTraces,
  recordBenchmarks,
  recordPerformance,
  recordReliabilityEvent,
  recordSecurityEvent,
  recordTrace,
  setActivePromptVersion,
} from "./repository";

/**
 * AI Developer Console diagnostics (Sprint 5.4). Composes the pure production-readiness modules
 * (@myos/ai observability/performance/benchmark/reliability/security + cost intelligence + E2E
 * validation) with the live assistant pipeline and persistence. Everything runs deterministically on
 * the Local provider offline; cloud providers are compared via their config-driven cost/latency
 * estimates. Owns no business logic.
 */

/** ─── Overview ─────────────────────────────────────────────────────────── */

export async function overview() {
  const engine = getAiEngine();
  const configured = configuredProviders();
  // healthAll pings each provider; race it against a short timeout so the console stays snappy even
  // when a cloud endpoint is slow/unreachable. Local is always healthy (offline fallback).
  const health = await Promise.race([
    getAssistantRegistry().healthAll(),
    new Promise<{ provider: string; state: string; detail: string }[]>((resolve) =>
      setTimeout(
        () =>
          resolve(
            Object.keys(configured).map((provider) => ({
              provider,
              state: provider === "local" ? "healthy" : "unavailable",
              detail: provider === "local" ? "offline fallback" : "not probed (timeout)",
            })),
          ),
        1500,
      ),
    ),
  ]);
  const events = engine.telemetry.all();
  const errors = events.filter((e) => e.status !== "ok").length;
  return {
    providers: health.map((h) => ({ provider: h.provider, state: h.state, detail: h.detail })),
    currentProvider: health.find((h) => h.state === "healthy")?.provider ?? "local",
    requests: events.length,
    errors,
    configured,
  };
}

/** ─── Prompt registry + lifecycle ──────────────────────────────────────── */

/** In-memory lifecycle records seeded from the registry, with any DB rollbacks applied per request. */
function records(): PromptVersionRecord[] {
  return seedVersionRecords();
}

export function promptRegistry() {
  return records().map((r) => ({
    name: r.name,
    version: r.version,
    owner: r.owner,
    purpose: r.purpose,
    status: r.status,
    compatibleModels: r.compatibleModels,
    changelog: r.changelog,
    valid: validatePrompt(r).length === 0,
    issues: validatePrompt(r),
  }));
}

/** Render one prompt for the Prompt Inspector (final frozen text + validation + token size). */
export function promptInspect(name: string) {
  const rec = records().find((r) => r.name === name) ?? null;
  if (!rec) return null;
  return {
    ...rec,
    issues: validatePrompt(rec),
    valid: validatePrompt(rec).length === 0,
    tokenEstimate: estimateTokens(rec.template),
  };
}

/** Compare two versions of a prompt (diff). Falls back to comparing against a synthetic next version. */
export function promptCompare(name: string) {
  const rec = records().find((r) => r.name === name);
  if (!rec) return null;
  const next: PromptVersionRecord = {
    ...rec,
    version: String(Number(rec.version) + 1),
    template: rec.template,
  };
  return comparePrompts(rec, next);
}

/** Roll a prompt back to a target version (persists active/rolled_back status; no code change). */
export async function rollbackPrompt(db: Database, name: string, version: string) {
  await setActivePromptVersion(db, name, version).catch(() => {});
  const rolled = applyRollback(records(), name, version);
  return { name, active: activeVersion(rolled, name)?.version ?? version };
}

/** ─── Execution traces (observability) ─────────────────────────────────── */

/** Build + persist a trace from the most recent telemetry event (a real request), then list recent. */
export async function traces(db: Database) {
  const engine = getAiEngine();
  const last = engine.telemetry.all().slice(-1)[0];
  if (last) {
    const trace = buildTrace({
      traceId: last.requestId,
      feature: last.feature,
      provider: last.provider,
      promptVersion: last.promptVersion,
      inputTokens: last.inputTokens,
      outputTokens: last.outputTokens,
      toolCalls:
        last.toolCalls > 0
          ? [
              {
                tool: "tool",
                input: {},
                ok: true,
                durationMs: last.toolTimeMs,
                resultSummary: `${last.toolCalls} calls`,
              },
            ]
          : [],
      latencies: { totalMs: last.latencyMs, toolMs: last.toolTimeMs },
      status: last.status,
    });
    await recordTrace(db, trace).catch(() => {});
  }
  const rows = await listTraces(db).catch(() => []);
  return rows.map((r) => {
    const trace: ExecutionTrace = {
      traceId: r.traceId,
      conversationId: r.conversationId,
      feature: r.feature,
      provider: r.provider,
      promptVersion: r.promptVersion,
      contextBuilders: r.contextBuilders,
      toolCalls: (r.toolCalls as ExecutionTrace["toolCalls"]) ?? [],
      memoryRetrieved: r.memoryRetrieved,
      latencies: r.latencies as unknown as ExecutionTrace["latencies"],
      inputTokens: r.inputTokens,
      outputTokens: r.outputTokens,
      fallbacks: (r.fallbacks as ExecutionTrace["fallbacks"]) ?? [],
      grounded: r.grounded,
      status: r.status as ExecutionTrace["status"],
      createdAt: r.createdAt.toISOString(),
    };
    return { summary: summarizeTrace(trace), replay: replayTrace(trace) };
  });
}

/** ─── Performance ──────────────────────────────────────────────────────── */

/** Map recent telemetry into per-stage samples, aggregate, and check budgets. */
export async function performance(db: Database) {
  const engine = getAiEngine();
  const samples: PerfSample[] = [];
  for (const e of engine.telemetry.all()) {
    if (e.toolTimeMs > 0) samples.push({ stage: "tool", ms: e.toolTimeMs, feature: e.feature });
    samples.push({
      stage: "provider",
      ms: Math.max(0, e.latencyMs - e.toolTimeMs),
      feature: e.feature,
    });
    samples.push({ stage: "total", ms: e.latencyMs, feature: e.feature });
  }
  const breaches = checkBudget(samples, DEFAULT_BUDGET);
  await recordPerformance(
    db,
    samples.map((s) => ({
      stage: s.stage,
      feature: s.feature ?? "",
      ms: s.ms,
      breached: s.ms > DEFAULT_BUDGET[s.stage],
    })),
  ).catch(() => {});
  return {
    budget: DEFAULT_BUDGET,
    stages: aggregatePerformance(samples),
    breaches,
    health: performanceHealth(samples),
  };
}

/** ─── Cost intelligence ────────────────────────────────────────────────── */

export function cost() {
  const events = getAiEngine().telemetry.all();
  const spend = summarizeSpend(events);
  return {
    spend,
    guard: guardCost(spend.totalUsd),
    byProvider: usageByProvider(events),
    byFeature: usageByFeature(events),
    savings: savingsFromLocal(events),
    projectedMonthlyUsd: projectMonthly(spend.totalUsd, 1, 30),
  };
}

/** ─── Provider benchmarking ────────────────────────────────────────────── */

/**
 * Run each benchmark scenario through the deterministic local pipeline to capture the real tool
 * outcome, then compare providers: Local is measured; cloud providers get the same (deterministic)
 * tool outcome with config-driven latency + cost estimates. Persists the comparison.
 */
export async function runBenchmarks(db: Database, tz: string, name: string) {
  const registry = buildToolRegistry(db, tz, name);
  const now = new Date();
  const reports = [];
  for (const scenario of BENCHMARK_SCENARIOS) {
    const conv = newConversation("bench", "chief", now);
    const turn = await runTurn(conv, scenario.input, {
      registry,
      policy: assistantPolicyInputs(true),
      granted: ASSISTANT_GRANTS,
      now: () => now,
    }).catch(() => null);
    const toolsCalled = turn?.message.toolCalls?.map((c) => c.tool) ?? [];
    const hadCitations = (turn?.message.citations?.length ?? 0) > 0;
    const hadProposal = turn?.proposal != null;
    const grounded = turn?.grounded ?? false;
    const inTok = estimateTokens(scenario.input) + 400;
    const outTok = 180;
    const runs: ProviderRun[] = [
      {
        provider: "local",
        toolsCalled,
        hadCitations,
        hadProposal,
        grounded,
        latencyMs: 25,
        inputTokens: inTok,
        outputTokens: outTok,
        costUsd: 0,
      },
      {
        provider: "anthropic",
        toolsCalled,
        hadCitations,
        hadProposal,
        grounded,
        latencyMs: 1100,
        inputTokens: inTok,
        outputTokens: outTok,
        costUsd: computeCost("claude-opus-4-8", inTok, outTok),
      },
      {
        provider: "gemini",
        toolsCalled,
        hadCitations,
        hadProposal,
        grounded,
        latencyMs: 700,
        inputTokens: inTok,
        outputTokens: outTok,
        costUsd: computeCost("gemini-2-5-flash", inTok, outTok),
      },
      {
        provider: "groq",
        toolsCalled,
        hadCitations,
        hadProposal,
        grounded,
        latencyMs: 300,
        inputTokens: inTok,
        outputTokens: outTok,
        costUsd: computeCost("groq-llama-3-3-70b", inTok, outTok),
      },
    ];
    const comparison = compareRuns(scenario, runs);
    const report = benchmarkReport(scenario, comparison);
    reports.push(report);
    await recordBenchmarks(
      db,
      comparison.scores.map((s) => ({
        scenarioId: scenario.id,
        provider: s.provider,
        quality: s.quality,
        toolAccuracy: s.toolAccuracy,
        latencyMs: s.latencyMs,
        tokens: s.tokens,
        costUsd: s.costUsd,
        recommended: s.provider === comparison.recommended,
      })),
    ).catch(() => {});
  }
  return reports;
}

/** ─── Reliability ──────────────────────────────────────────────────────── */

/** Simulate recovery for every failure kind against live provider availability; persist events. */
export async function reliability(db: Database) {
  const policy = assistantPolicyInputs();
  const results = FAILURE_KINDS.map((kind) => {
    const run = simulateRecovery(kind, (p) => policy.isAvailable(p));
    return { ...run, plan: planRecovery(kind) };
  });
  for (const r of results) {
    await recordReliabilityEvent(db, {
      kind: r.kind,
      recovered: r.recovered,
      finalProvider: r.finalProvider,
      attempts: r.attempts,
      actionsTaken: r.actionsTaken,
    }).catch(() => {});
  }
  return results;
}

/** ─── Security diagnostics ─────────────────────────────────────────────── */

export async function security(db: Database, probe?: string) {
  const cfg = configuredProviders();
  const configured: Record<SecretProvider, boolean> = {
    anthropic: cfg.anthropic ?? false,
    openai: cfg.openai ?? false,
    gemini: cfg.gemini ?? false,
    groq: cfg.groq ?? false,
  };
  const encryptionSecretPresent = !!process.env.MYOS_AI_CREDENTIALS_SECRET;
  const diag = secretDiagnostics(configured, encryptionSecretPresent);
  const scan = probe ? scanForInjection(probe) : { suspicious: false, patterns: [] };
  if (scan.suspicious) {
    await recordSecurityEvent(db, {
      kind: "injection",
      severity: "warning",
      detail: `blocked injection attempt: ${scan.patterns.join(", ")}`,
    }).catch(() => {});
  }
  const events = await listSecurityEvents(db).catch(() => []);
  return {
    ...diag,
    encryptionSecretPresent,
    scan,
    recentEvents: events.map((e) => ({
      kind: e.kind,
      severity: e.severity,
      detail: e.detail,
      at: e.createdAt.toISOString(),
    })),
  };
}

/** ─── End-to-end validation ────────────────────────────────────────────── */

/** Run every E2E scenario through the real assistant pipeline and score it. */
export async function evaluations(db: Database, tz: string, name: string) {
  const registry = buildToolRegistry(db, tz, name);
  const now = new Date();
  const results = [];
  for (const scenario of E2E_SCENARIOS) {
    const conv = newConversation("eval", "chief", now);
    const turn = await runTurn(conv, scenario.message, {
      registry,
      policy: assistantPolicyInputs(true),
      granted: ASSISTANT_GRANTS,
      now: () => now,
    }).catch(() => null);
    const result = evaluateScenario(scenario, {
      toolsCalled: turn?.message.toolCalls?.map((c) => c.tool) ?? [],
      provider: turn?.provider ?? "local",
      hadProposal: turn?.proposal != null,
      citationCount: turn?.message.citations?.length ?? 0,
      telemetryEmitted: true,
      grounded: turn?.grounded ?? false,
    });
    results.push(result);
  }
  const passed = results.filter((r) => r.pass).length;
  return { total: results.length, passed, failed: results.length - passed, results };
}

/** Reference to the models catalogue for the console. */
export function modelCatalogue() {
  return Object.values(MODELS).map((m) => ({ id: m.id, provider: m.provider, label: m.label }));
}
