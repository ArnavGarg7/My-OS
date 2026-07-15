import { ENERGY_SCORE, type EnergyLevel } from "./constants";
import type { EnergyResult, SleepAnalysis } from "./types";

/**
 * Energy engine (Sprint 2.9). Uses the logged energy level when present;
 * otherwise derives one deterministically from sleep score. No AI.
 */
export function scoreToLevel(score: number): EnergyLevel {
  if (score >= 80) return "high";
  if (score >= 50) return "medium";
  return "low";
}

export function resolveEnergy(
  logged: EnergyLevel | null,
  sleep: SleepAnalysis | null,
): EnergyResult {
  if (logged) {
    return { level: logged, score: ENERGY_SCORE[logged], source: "logged" };
  }
  const score = sleep ? sleep.score : 50;
  return { level: scoreToLevel(score), score, source: "derived" };
}
