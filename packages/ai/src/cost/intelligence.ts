/**
 * Cost Intelligence (Sprint 5.4, 06_AI_Architecture §14). Builds on the Cost Manager ([[index]]):
 * breaks spend down per provider and per feature, derives daily usage trends, projects the month,
 * and quantifies the savings the Local provider delivers (what the same tokens would have cost on a
 * cloud model). Pure — the server feeds it persisted telemetry.
 */
import { computeCost, roundUsd } from "../config/costs";
import type { TelemetryEvent } from "../schemas";

export interface ProviderUsage {
  provider: string;
  requests: number;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
}

/** Aggregate usage per provider. */
export function usageByProvider(events: readonly TelemetryEvent[]): ProviderUsage[] {
  const map = new Map<string, ProviderUsage>();
  for (const e of events) {
    const u = map.get(e.provider) ?? {
      provider: e.provider,
      requests: 0,
      inputTokens: 0,
      outputTokens: 0,
      costUsd: 0,
    };
    u.requests += 1;
    u.inputTokens += e.inputTokens;
    u.outputTokens += e.outputTokens;
    u.costUsd = roundUsd(u.costUsd + e.costUsd);
    map.set(e.provider, u);
  }
  return [...map.values()].sort((a, b) => b.costUsd - a.costUsd);
}

export interface FeatureUsage {
  feature: string;
  requests: number;
  costUsd: number;
  tokens: number;
}

/** Aggregate usage per feature (Chief / Chat / Memory / Summaries / Planning …). */
export function usageByFeature(events: readonly TelemetryEvent[]): FeatureUsage[] {
  const map = new Map<string, FeatureUsage>();
  for (const e of events) {
    const f = map.get(e.feature) ?? { feature: e.feature, requests: 0, costUsd: 0, tokens: 0 };
    f.requests += 1;
    f.costUsd = roundUsd(f.costUsd + e.costUsd);
    f.tokens += e.inputTokens + e.outputTokens;
    map.set(e.feature, f);
  }
  return [...map.values()].sort((a, b) => b.costUsd - a.costUsd);
}

export interface DailyUsage {
  day: string;
  requests: number;
  costUsd: number;
}

/** Daily usage trend from events carrying an ISO `day` (derived from a timestamp by the caller). */
export function usageTrend(events: readonly { day: string; costUsd: number }[]): DailyUsage[] {
  const map = new Map<string, DailyUsage>();
  for (const e of events) {
    const d = map.get(e.day) ?? { day: e.day, requests: 0, costUsd: 0 };
    d.requests += 1;
    d.costUsd = roundUsd(d.costUsd + e.costUsd);
    map.set(e.day, d);
  }
  return [...map.values()].sort((a, b) => a.day.localeCompare(b.day));
}

/** Straight-line monthly projection from today's spend. */
export function projectMonthly(spentTodayUsd: number, dayOfMonth = 1, daysInMonth = 30): number {
  if (dayOfMonth <= 0) return roundUsd(spentTodayUsd * daysInMonth);
  return roundUsd((spentTodayUsd / dayOfMonth) * daysInMonth);
}

export interface LocalSavings {
  localRequests: number;
  localTokens: number;
  /** What those Local-served tokens would have cost on the reference cloud model. */
  hypotheticalCloudUsd: number;
  /** Actual Local cost (always 0). */
  actualUsd: number;
  savedUsd: number;
}

/**
 * Quantify savings from the Local provider: for every Local-served request, compute what the same
 * tokens would have cost on `referenceModel` (default Opus). Local itself is free, so that delta is
 * the saving.
 */
export function savingsFromLocal(
  events: readonly TelemetryEvent[],
  referenceModel = "claude-opus-4-8",
): LocalSavings {
  let localRequests = 0;
  let localTokens = 0;
  let hypothetical = 0;
  for (const e of events) {
    if (e.provider !== "local") continue;
    localRequests += 1;
    localTokens += e.inputTokens + e.outputTokens;
    hypothetical += computeCost(referenceModel, e.inputTokens, e.outputTokens);
  }
  const hypotheticalCloudUsd = roundUsd(hypothetical);
  return {
    localRequests,
    localTokens,
    hypotheticalCloudUsd,
    actualUsd: 0,
    savedUsd: hypotheticalCloudUsd,
  };
}
