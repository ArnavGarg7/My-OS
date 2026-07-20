/**
 * AI Performance Engineering (Sprint 5.4, 06_AI_Architecture §Performance). Measures each stage of a
 * request — context construction, memory retrieval, tool execution, provider response, streaming
 * startup, total completion — against declared budgets, and raises alerts when a budget is exceeded.
 * Pure: percentile/aggregate math + budget checks. The server feeds it recorded samples.
 */

/** The stages a request passes through. */
export type PerfStage = "context" | "memory" | "tool" | "provider" | "streamStart" | "total";

export const PERF_STAGES: readonly PerfStage[] = [
  "context",
  "memory",
  "tool",
  "provider",
  "streamStart",
  "total",
] as const;

/** One measured latency for a stage (ms). */
export interface PerfSample {
  stage: PerfStage;
  ms: number;
  feature?: string;
}

/** Per-stage budget ceilings (ms). A stage over its ceiling is a breach. */
export type PerformanceBudget = Record<PerfStage, number>;

/** Default budgets (ms). Generous for the deterministic Local tier; tightened per deployment. */
export const DEFAULT_BUDGET: PerformanceBudget = {
  context: 150,
  memory: 100,
  tool: 500,
  provider: 4000,
  streamStart: 1200,
  total: 6000,
};

/** Deterministic nearest-rank percentile over a numeric list (0..100). */
export function percentile(values: readonly number[], p: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const rank = Math.ceil((p / 100) * sorted.length);
  const idx = Math.min(sorted.length - 1, Math.max(0, rank - 1));
  return sorted[idx] as number;
}

export interface StageStats {
  stage: PerfStage;
  count: number;
  min: number;
  max: number;
  avg: number;
  p50: number;
  p95: number;
}

/** Aggregate samples by stage into count/min/max/avg/p50/p95. */
export function aggregatePerformance(samples: readonly PerfSample[]): StageStats[] {
  const out: StageStats[] = [];
  for (const stage of PERF_STAGES) {
    const xs = samples.filter((s) => s.stage === stage).map((s) => s.ms);
    if (xs.length === 0) continue;
    const sum = xs.reduce((a, b) => a + b, 0);
    out.push({
      stage,
      count: xs.length,
      min: Math.min(...xs),
      max: Math.max(...xs),
      avg: Math.round((sum / xs.length) * 100) / 100,
      p50: percentile(xs, 50),
      p95: percentile(xs, 95),
    });
  }
  return out;
}

export interface BudgetBreach {
  stage: PerfStage;
  ms: number;
  budgetMs: number;
  overBy: number;
  feature: string | null;
}

/** Return every sample that exceeded its stage budget (an alert-worthy breach). */
export function checkBudget(
  samples: readonly PerfSample[],
  budget: PerformanceBudget = DEFAULT_BUDGET,
): BudgetBreach[] {
  const breaches: BudgetBreach[] = [];
  for (const s of samples) {
    const ceiling = budget[s.stage];
    if (s.ms > ceiling) {
      breaches.push({
        stage: s.stage,
        ms: s.ms,
        budgetMs: ceiling,
        overBy: Math.round((s.ms - ceiling) * 100) / 100,
        feature: s.feature ?? null,
      });
    }
  }
  return breaches;
}

/** Health verdict from p95 vs budget across stages. */
export function performanceHealth(
  samples: readonly PerfSample[],
  budget: PerformanceBudget = DEFAULT_BUDGET,
): { healthy: boolean; breachedStages: PerfStage[] } {
  const stats = aggregatePerformance(samples);
  const breachedStages = stats.filter((s) => s.p95 > budget[s.stage]).map((s) => s.stage);
  return { healthy: breachedStages.length === 0, breachedStages };
}
