import type { Readiness } from "./types";
import type { RecommendationLevel } from "./constants";

/**
 * Recovery planning (Sprint 4.2). Pure recommendations derived from readiness — a
 * deterministic recovery plan. No generated text; structured suggestions only.
 */
export interface RecoveryPlan {
  level: RecommendationLevel;
  restDayRecommended: boolean;
  suggestions: string[];
}

export function recoveryPlan(readiness: Readiness): RecoveryPlan {
  const suggestions: string[] = [];
  const restDayRecommended = readiness.trainingRecommendation === "rest" || readiness.risk >= 60;

  if (readiness.components.find((c) => c.label === "Sleep" && c.value < 60))
    suggestions.push("Prioritise sleep tonight — aim for your full target.");
  if (readiness.components.find((c) => c.label === "Hydration" && c.value < 60))
    suggestions.push("Increase water intake through the day.");
  if (readiness.recovery < 50) suggestions.push("Keep training light; favour mobility + walking.");
  if (readiness.risk >= 60)
    suggestions.push("Elevated injury risk — avoid heavy or explosive loads.");
  if (suggestions.length === 0)
    suggestions.push("You're recovered — a normal training day is fine.");

  return { level: readiness.trainingRecommendation, restDayRecommended, suggestions };
}
