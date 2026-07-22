/**
 * Connector Health + Retry (Sprint 6.4, spec §Connector Health / §Retry). Deterministic health
 * scoring from sync age, failures, rate limits and latency, plus exponential backoff for retries.
 * Pure — the server feeds observed numbers. A connector failure never interrupts the Event Engine;
 * this only reports.
 */
import type { ConnectorHealth, ConnectorState } from "./types";

export interface HealthInput {
  accountId: string;
  state: ConnectorState;
  latencyMs: number;
  syncAgeMinutes: number;
  failures: number;
  rateLimited: boolean;
  lastEventAt: string | null;
}

const clamp = (n: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, n));

/** Compute a 0..100 health score + reasons. Deterministic. */
export function computeHealth(input: HealthInput): ConnectorHealth {
  const reasons: string[] = [];
  let score = 100;

  if (input.state === "failed") {
    score = 0;
    reasons.push("connection failed");
  }
  if (input.syncAgeMinutes > 60) {
    score -= Math.min(40, Math.floor(input.syncAgeMinutes / 60) * 10);
    reasons.push(`last sync ${input.syncAgeMinutes}m ago`);
  }
  if (input.failures > 0) {
    score -= Math.min(30, input.failures * 10);
    reasons.push(`${input.failures} recent failure(s)`);
  }
  if (input.rateLimited) {
    score -= 15;
    reasons.push("rate limited");
  }
  if (input.latencyMs > 2000) {
    score -= 10;
    reasons.push("high latency");
  }

  return {
    accountId: input.accountId,
    state: input.state,
    score: clamp(score),
    latencyMs: input.latencyMs,
    syncAgeMinutes: input.syncAgeMinutes,
    failures: input.failures,
    rateLimited: input.rateLimited,
    lastEventAt: input.lastEventAt,
    reasons: reasons.length ? reasons : ["healthy"],
  };
}

/** The health band from a score. */
export function healthBand(score: number): "healthy" | "warning" | "failed" {
  if (score >= 70) return "healthy";
  if (score >= 30) return "warning";
  return "failed";
}

/** Exponential backoff (ms) for a retry attempt, capped. Deterministic (no jitter). */
export function backoffMs(attempt: number, baseMs = 1000, capMs = 60_000): number {
  return Math.min(capMs, baseMs * 2 ** Math.max(0, attempt - 1));
}
