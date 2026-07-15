import { READINESS_BANDS, READINESS_WEIGHTS } from "./constants";
import type {
  EnergyResult,
  HydrationSummary,
  ReadinessResult,
  RecoveryResult,
  SleepAnalysis,
} from "./types";

/**
 * Readiness engine (Sprint 2.9). One 0–100 score blending sleep, recovery,
 * hydration and energy. This is the first-class input the Planner and Decision
 * engines consume. Deterministic; weights sum to 1.
 */
export function computeReadiness(input: {
  sleep: SleepAnalysis | null;
  recovery: RecoveryResult;
  hydration: HydrationSummary;
  energy: EnergyResult;
}): ReadinessResult {
  const sleepScore = input.sleep?.score ?? 50;
  const recoveryScore = input.recovery.score;
  const hydrationScore = input.hydration.completionPercent;
  const energyScore = input.energy.score;

  const score = Math.round(
    sleepScore * READINESS_WEIGHTS.sleep +
      recoveryScore * READINESS_WEIGHTS.recovery +
      hydrationScore * READINESS_WEIGHTS.hydration +
      energyScore * READINESS_WEIGHTS.energy,
  );

  return {
    score,
    band: toBand(score),
    inputs: {
      sleep: sleepScore,
      recovery: recoveryScore,
      hydration: hydrationScore,
      energy: energyScore,
    },
    recommendation: recommend(score),
  };
}

export function toBand(score: number): ReadinessResult["band"] {
  if (score >= READINESS_BANDS.high) return "high";
  if (score >= READINESS_BANDS.moderate) return "moderate";
  if (score >= READINESS_BANDS.low) return "low";
  return "very_low";
}

function recommend(score: number): string {
  if (score >= READINESS_BANDS.high) return "Tackle your hardest work first — you're primed.";
  if (score >= READINESS_BANDS.moderate) return "A solid day — protect one deep-work block.";
  if (score >= READINESS_BANDS.low) return "Ease up: shorter focus blocks, more buffers.";
  return "Prioritise recovery — keep today light.";
}
