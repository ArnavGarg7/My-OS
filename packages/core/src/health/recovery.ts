import {
  ENERGY_SCORE,
  RECOVERY_THRESHOLDS,
  type EnergyLevel,
  type RecoveryStatus,
} from "./constants";
import { intensityBand, trainingLoad } from "./workout";
import type { RecoveryResult, SleepAnalysis, Workout } from "./types";

/**
 * Recovery engine (Sprint 2.9). Deterministic recovery score from sleep,
 * training load, recent RPE and manual energy → one of recovered / recovering /
 * fatigued / overtrained. Rule-based; not medical advice.
 */
export function assessRecovery(input: {
  sleep: SleepAnalysis | null;
  recentWorkouts: Workout[]; // last ~2 days
  energy: EnergyLevel | null;
}): RecoveryResult {
  const reasons: string[] = [];
  let score = 70; // neutral baseline

  // Sleep drives recovery the most.
  if (input.sleep) {
    const delta = Math.round((input.sleep.score - 60) * 0.5);
    score += delta;
    if (input.sleep.score < 50) reasons.push("Poor sleep last night");
    if (input.sleep.debtMinutes > 180) {
      score -= 10;
      reasons.push(`Sleep debt of ${Math.round(input.sleep.debtMinutes / 60)}h`);
    }
  } else {
    reasons.push("No sleep logged");
  }

  // Training load fatigues.
  const load = trainingLoad(input.recentWorkouts);
  if (load > 120) {
    score -= 20;
    reasons.push("High recent training load");
  } else if (load > 60) {
    score -= 10;
    reasons.push("Moderate training load");
  }

  // A very hard recent session adds fatigue.
  const hard = input.recentWorkouts.some((w) => w.completed && intensityBand(w.rpe) === "max");
  if (hard) {
    score -= 8;
    reasons.push("Max-effort session recently");
  }

  // Manual energy nudges.
  if (input.energy) {
    score += Math.round((ENERGY_SCORE[input.energy] - 65) * 0.15);
    if (input.energy === "low") reasons.push("Low energy reported");
  }

  score = Math.max(0, Math.min(100, score));
  const status = toStatus(score, load);
  if (reasons.length === 0) reasons.push("Well recovered — no fatigue signals");
  return { status, score, reasons };
}

function toStatus(score: number, load: number): RecoveryStatus {
  if (load > 160 && score < RECOVERY_THRESHOLDS.fatigued) return "overtrained";
  if (score >= RECOVERY_THRESHOLDS.recovered) return "recovered";
  if (score >= RECOVERY_THRESHOLDS.recovering) return "recovering";
  return "fatigued";
}
