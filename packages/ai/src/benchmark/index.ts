/**
 * Provider Benchmarking (Sprint 5.4, 06_AI_Architecture §Benchmarking). Runs an identical workload
 * against every provider (Anthropic / Gemini / Groq / Local) and compares them objectively across
 * quality, citation quality, tool accuracy, proposal quality, latency, token usage and estimated
 * cost. Pure scoring + comparison + report — the server executes the runs and feeds results here.
 */

/** A benchmark scenario: an input plus the deterministic expectations to score against. */
export interface BenchmarkScenario {
  id: string;
  input: string;
  /** Tools a correct run should call (order-independent). */
  expectedTools: string[];
  /** Whether a correct answer must cite ≥1 source. */
  expectCitations: boolean;
  /** Whether the request should yield a proposal (mutation). */
  expectProposal: boolean;
}

/** The raw, measured outcome of running one scenario on one provider. */
export interface ProviderRun {
  provider: string;
  toolsCalled: string[];
  hadCitations: boolean;
  hadProposal: boolean;
  grounded: boolean;
  latencyMs: number;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
}

/** Scored quality dimensions (0..1) plus the pass-through cost/latency. */
export interface BenchmarkScore {
  provider: string;
  toolAccuracy: number;
  citationQuality: number;
  proposalQuality: number;
  grounding: number;
  /** Weighted overall quality (0..1). */
  quality: number;
  latencyMs: number;
  tokens: number;
  costUsd: number;
}

/** Jaccard-style set accuracy between called and expected tools (1 when both empty). */
function toolAccuracy(called: readonly string[], expected: readonly string[]): number {
  if (expected.length === 0 && called.length === 0) return 1;
  const exp = new Set(expected);
  const got = new Set(called);
  const inter = [...exp].filter((t) => got.has(t)).length;
  const union = new Set([...exp, ...got]).size;
  return union === 0 ? 1 : Math.round((inter / union) * 100) / 100;
}

/** Score one provider's run against the scenario expectations. Deterministic. */
export function scoreRun(scenario: BenchmarkScenario, run: ProviderRun): BenchmarkScore {
  const ta = toolAccuracy(run.toolsCalled, scenario.expectedTools);
  const cq = scenario.expectCitations ? (run.hadCitations ? 1 : 0) : 1;
  const pq = scenario.expectProposal ? (run.hadProposal ? 1 : 0) : run.hadProposal ? 0.5 : 1;
  const gr = run.grounded ? 1 : 0;
  const quality = Math.round((ta * 0.4 + cq * 0.2 + pq * 0.2 + gr * 0.2) * 100) / 100;
  return {
    provider: run.provider,
    toolAccuracy: ta,
    citationQuality: cq,
    proposalQuality: pq,
    grounding: gr,
    quality,
    latencyMs: run.latencyMs,
    tokens: run.inputTokens + run.outputTokens,
    costUsd: run.costUsd,
  };
}

export interface BenchmarkComparison {
  scenarioId: string;
  scores: BenchmarkScore[];
  /** Winner per dimension (provider name). */
  bestQuality: string;
  bestLatency: string;
  cheapest: string;
  /** Overall recommendation: best quality, ties broken by lower cost then latency. */
  recommended: string;
}

/** Compare provider scores for one scenario and pick per-dimension + overall winners. */
export function compareRuns(
  scenario: BenchmarkScenario,
  runs: readonly ProviderRun[],
): BenchmarkComparison {
  const scores = runs.map((r) => scoreRun(scenario, r));
  const byQuality = [...scores].sort(
    (a, b) => b.quality - a.quality || a.costUsd - b.costUsd || a.latencyMs - b.latencyMs,
  );
  const byLatency = [...scores].sort((a, b) => a.latencyMs - b.latencyMs);
  const byCost = [...scores].sort((a, b) => a.costUsd - b.costUsd || a.latencyMs - b.latencyMs);
  const empty = { provider: "—" };
  return {
    scenarioId: scenario.id,
    scores,
    bestQuality: (byQuality[0] ?? empty).provider,
    bestLatency: (byLatency[0] ?? empty).provider,
    cheapest: (byCost[0] ?? empty).provider,
    recommended: (byQuality[0] ?? empty).provider,
  };
}

/** A rendered comparison report line per provider, plus the headline recommendation. */
export interface BenchmarkReport {
  scenarioId: string;
  input: string;
  recommended: string;
  rows: {
    provider: string;
    quality: number;
    toolAccuracy: number;
    latencyMs: number;
    tokens: number;
    costUsd: number;
  }[];
}

/** Build a report object from a comparison (ready for a table). */
export function benchmarkReport(
  scenario: BenchmarkScenario,
  comparison: BenchmarkComparison,
): BenchmarkReport {
  return {
    scenarioId: scenario.id,
    input: scenario.input,
    recommended: comparison.recommended,
    rows: comparison.scores
      .map((s) => ({
        provider: s.provider,
        quality: s.quality,
        toolAccuracy: s.toolAccuracy,
        latencyMs: s.latencyMs,
        tokens: s.tokens,
        costUsd: s.costUsd,
      }))
      .sort((a, b) => b.quality - a.quality),
  };
}

/** The built-in benchmark scenarios (mirror the E2E validation set). */
export const BENCHMARK_SCENARIOS: readonly BenchmarkScenario[] = [
  {
    id: "now",
    input: "What should I do now?",
    expectedTools: ["chief_now"],
    expectCitations: true,
    expectProposal: false,
  },
  {
    id: "move",
    input: "Move gym to Friday.",
    expectedTools: ["query_calendar"],
    expectCitations: false,
    expectProposal: true,
  },
  {
    id: "explain",
    input: "Explain today's recommendation.",
    expectedTools: ["chief_now"],
    expectCitations: true,
    expectProposal: false,
  },
  {
    id: "summarize",
    input: "Summarize yesterday.",
    expectedTools: ["query_tasks"],
    expectCitations: true,
    expectProposal: false,
  },
  {
    id: "review",
    input: "Review pending decisions.",
    expectedTools: ["chief_now"],
    expectCitations: true,
    expectProposal: false,
  },
] as const;
