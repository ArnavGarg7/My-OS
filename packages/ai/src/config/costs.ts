/**
 * Cost model (Sprint 5.1, 06_AI_Architecture §14). Pure token→USD math plus the budget caps the
 * Cost Manager enforces. No side effects — the manager module composes these with usage records.
 */
import { getModel } from "./models";

/** Compute USD cost for a completed call. Unknown model → 0 (local/free assumption). */
export function computeCost(modelKey: string, inputTokens: number, outputTokens: number): number {
  const m = getModel(modelKey);
  if (!m) return 0;
  return (
    (inputTokens / 1_000_000) * m.inputCostPerMTok +
    (outputTokens / 1_000_000) * m.outputCostPerMTok
  );
}

/** Round a USD figure to 6 decimals (sub-cent precision) deterministically. */
export function roundUsd(usd: number): number {
  return Math.round(usd * 1_000_000) / 1_000_000;
}

/** Default budget caps (06_AI_Architecture §14). Configurable per deployment. */
export const BUDGET = {
  /** Soft cap ($/day): interactive AI asks for confirmation; background jobs downgrade. */
  softDailyUsd: 2,
  /** Hard cap ($/day): AI paused, requests error with AI_BUDGET_EXCEEDED. */
  hardDailyUsd: 5,
} as const;

export type BudgetVerdict = "ok" | "soft_exceeded" | "hard_exceeded";

/** Classify spend-so-far against the caps. Pure. */
export function classifyBudget(spentTodayUsd: number, budget = BUDGET): BudgetVerdict {
  if (spentTodayUsd >= budget.hardDailyUsd) return "hard_exceeded";
  if (spentTodayUsd >= budget.softDailyUsd) return "soft_exceeded";
  return "ok";
}
