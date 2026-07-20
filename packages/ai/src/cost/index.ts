/**
 * Cost Manager (Sprint 5.1, 06_AI_Architecture §14). Tracks spend (daily/weekly/monthly, per
 * feature/provider) from telemetry events and enforces soft/hard caps with a deterministic
 * downgrade recommendation. Pure — the server feeds it persisted usage and acts on its verdict.
 */
import { BUDGET, classifyBudget, roundUsd, type BudgetVerdict } from "../config/costs";
import type { TelemetryEvent } from "../schemas";

export interface SpendWindow {
  totalUsd: number;
  byFeature: Record<string, number>;
  byProvider: Record<string, number>;
}

/** Sum spend over events (pure). */
export function summarizeSpend(events: readonly TelemetryEvent[]): SpendWindow {
  const win: SpendWindow = { totalUsd: 0, byFeature: {}, byProvider: {} };
  for (const e of events) {
    win.totalUsd += e.costUsd;
    win.byFeature[e.feature] = (win.byFeature[e.feature] ?? 0) + e.costUsd;
    win.byProvider[e.provider] = (win.byProvider[e.provider] ?? 0) + e.costUsd;
  }
  win.totalUsd = roundUsd(win.totalUsd);
  return win;
}

export type CostAction = "allow" | "confirm" | "downgrade" | "block";

export interface CostGuardResult {
  verdict: BudgetVerdict;
  /** What the caller should do (06_AI_Architecture §14). */
  interactive: CostAction;
  background: CostAction;
}

/**
 * Given today's spend, decide what interactive and background callers should do:
 * - ok            → allow / allow
 * - soft_exceeded → interactive asks confirmation; background downgrades to cheaper/skip
 * - hard_exceeded → block both (AI paused).
 */
export function guardCost(spentTodayUsd: number, budget = BUDGET): CostGuardResult {
  const verdict = classifyBudget(spentTodayUsd, budget);
  if (verdict === "hard_exceeded") return { verdict, interactive: "block", background: "block" };
  if (verdict === "soft_exceeded")
    return { verdict, interactive: "confirm", background: "downgrade" };
  return { verdict, interactive: "allow", background: "allow" };
}

export {
  usageByProvider,
  usageByFeature,
  usageTrend,
  projectMonthly,
  savingsFromLocal,
  type ProviderUsage,
  type FeatureUsage,
  type DailyUsage,
  type LocalSavings,
} from "./intelligence";
