import { HIGH_TRAINING_LOAD, READINESS_WEIGHTS, type RecommendationLevel } from "./constants";
import type { Readiness } from "./types";
import { clamp, type ReadinessInputs } from "./health-signals";

/**
 * Readiness expansion (Sprint 4.2). A richer, fully DERIVED readiness score from sleep,
 * recovery, hydration, nutrition, workout load, injuries and habit consistency —
 * deterministic, weighted and explainable (every component is shown). Produces training /
 * work / study recommendations. Extends the Health engine's readiness; owns no health
 * logic.
 */

/** Workout-load contributes positively up to a point, then over-load reduces readiness. */
function loadScore(workoutLoad: number): number {
  if (workoutLoad <= 0) return 60; // no training logged — neutral
  const ratio = workoutLoad / HIGH_TRAINING_LOAD;
  if (ratio <= 1) return clamp(60 + ratio * 40); // building fitness
  return clamp(100 - (ratio - 1) * 60); // overreaching penalty
}

function level(score: number): RecommendationLevel {
  if (score >= 80) return "push";
  if (score >= 60) return "maintain";
  if (score >= 40) return "ease";
  return "rest";
}

export function computeReadiness(inputs: ReadinessInputs): Readiness {
  const w = READINESS_WEIGHTS;
  const components = [
    { label: "Sleep", value: clamp(inputs.sleep), weight: w.sleep },
    { label: "Recovery", value: clamp(inputs.recovery), weight: w.recovery },
    { label: "Hydration", value: clamp(inputs.hydration), weight: w.hydration },
    { label: "Nutrition", value: clamp(inputs.nutrition), weight: w.nutrition },
    { label: "Workout load", value: loadScore(inputs.workoutLoad), weight: w.workoutLoad },
    { label: "Injuries", value: clamp(100 - inputs.injuryBurden), weight: w.injuries },
    { label: "Habits", value: clamp(inputs.habitConsistency), weight: w.habitConsistency },
  ];

  const totalWeight = components.reduce((n, c) => n + c.weight, 0);
  let score = components.reduce((n, c) => n + c.value * c.weight, 0) / totalWeight;
  if (inputs.medicationDue) score -= 3; // small deterministic penalty
  score = clamp(score);

  const recovery = clamp((inputs.recovery + (100 - inputs.injuryBurden)) / 2);
  const risk = clamp(
    inputs.injuryBurden * 0.5 +
      Math.max(0, inputs.workoutLoad / HIGH_TRAINING_LOAD - 1) * 60 +
      (100 - inputs.sleep) * 0.2,
  );

  return {
    score,
    recovery,
    risk,
    trainingRecommendation: risk >= 60 ? "rest" : level(score),
    workRecommendation: level(score),
    studyRecommendation: level(clamp((score + inputs.sleep) / 2)),
    components: components.map((c) => ({ label: c.label, value: c.value })),
  };
}
