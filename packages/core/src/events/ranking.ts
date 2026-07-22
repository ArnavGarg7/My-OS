/**
 * Signal Ranking Engine (Sprint 6.1). Scores each signal on importance / urgency / confidence /
 * recency / impact and combines them into a deterministic priority (0..100). **The AI never ranks
 * signals** — this is pure math over the signal's own fields + `now`.
 */
import type { RankedSignal, Signal, SignalRanking } from "./types";
import {
  CATEGORY_IMPORTANCE,
  RANKING_WEIGHTS,
  RECENCY_HALFLIFE_HOURS,
  SEVERITY_IMPACT,
  WINDOW_URGENCY,
} from "./constants";

const clamp01 = (n: number): number => Math.max(0, Math.min(1, n));

/** Exponential recency decay from the signal's age at `now` (newer → closer to 1). */
function recencyScore(createdAt: string, now: Date): number {
  const ageHours = Math.max(0, (now.getTime() - new Date(createdAt).getTime()) / 3_600_000);
  return clamp01(Math.pow(0.5, ageHours / RECENCY_HALFLIFE_HOURS));
}

/** Urgency rises as an expiry approaches (blended with the window baseline). */
function urgencyScore(signal: Signal, now: Date): number {
  const base = WINDOW_URGENCY[signal.window];
  if (!signal.expiresAt) return base;
  const total = new Date(signal.expiresAt).getTime() - new Date(signal.createdAt).getTime();
  if (total <= 0) return 1;
  const remaining = new Date(signal.expiresAt).getTime() - now.getTime();
  const elapsedFrac = clamp01(1 - remaining / total);
  // Blend: baseline plus how far through its lifetime it is.
  return clamp01(base * 0.6 + elapsedFrac * 0.4);
}

/** Compute the ranking dimensions + composite priority for a signal at `now`. Deterministic. */
export function rankSignal(signal: Signal, now: Date): SignalRanking {
  const importance = clamp01(CATEGORY_IMPORTANCE[signal.category]);
  const impact = clamp01(SEVERITY_IMPACT[signal.severity]);
  const confidence = clamp01(signal.confidence);
  const urgency = urgencyScore(signal, now);
  const recency = recencyScore(signal.createdAt, now);
  const priority =
    Math.round(
      (importance * RANKING_WEIGHTS.importance +
        urgency * RANKING_WEIGHTS.urgency +
        impact * RANKING_WEIGHTS.impact +
        confidence * RANKING_WEIGHTS.confidence +
        recency * RANKING_WEIGHTS.recency) *
        1000,
    ) / 10; // 0..100, one decimal
  return { importance, urgency, confidence, recency, impact, priority };
}

/** Rank a batch and sort by priority (desc), ties broken by createdAt (newer first). */
export function rankSignals(
  signals: readonly Signal[],
  now: Date,
): (Signal & { ranking: SignalRanking })[] {
  return signals
    .map((s) => ({ ...s, ranking: rankSignal(s, now) }))
    .sort(
      (a, b) => b.ranking.priority - a.ranking.priority || b.createdAt.localeCompare(a.createdAt),
    );
}

/** Attach a ranking without sorting (used when the engine composes RankedSignal). */
export function withRanking(signal: Signal, now: Date): RankedSignal {
  return { ...signal, ranking: rankSignal(signal, now), notify: "silent" };
}
