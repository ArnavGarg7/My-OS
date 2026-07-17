import type { ReviewFrequency } from "./constants";

/**
 * Review engine (Sprint 4.2). Builds DETERMINISTIC structured period reviews (weekly/
 * monthly/quarterly/annual). NO generated text — only structured summaries derived from
 * the metrics the server passes in (habit adherence, routine consistency, goal velocity,
 * health improvement, knowledge/learning/workout/reading consistency).
 */
export interface ReviewMetrics {
  habitAdherence: number;
  routineConsistency: number;
  goalVelocity: number;
  healthImprovement: number;
  knowledgeGrowth: number;
  learningConsistency: number;
  workoutConsistency: number;
  readingConsistency: number;
}

export interface ReviewSummary {
  frequency: ReviewFrequency;
  metrics: ReviewMetrics;
  overall: number;
  highlights: string[];
  concerns: string[];
}

const LABELS: Record<keyof ReviewMetrics, string> = {
  habitAdherence: "Habit adherence",
  routineConsistency: "Routine consistency",
  goalVelocity: "Goal velocity",
  healthImprovement: "Health improvement",
  knowledgeGrowth: "Knowledge growth",
  learningConsistency: "Learning consistency",
  workoutConsistency: "Workout consistency",
  readingConsistency: "Reading consistency",
};

export function buildReview(frequency: ReviewFrequency, metrics: ReviewMetrics): ReviewSummary {
  const entries = Object.entries(metrics) as [keyof ReviewMetrics, number][];
  const overall = Math.round(entries.reduce((n, [, v]) => n + v, 0) / entries.length);

  const highlights = entries
    .filter(([, v]) => v >= 75)
    .sort((a, b) => b[1] - a[1])
    .map(([k, v]) => `${LABELS[k]}: ${v}%`);
  const concerns = entries
    .filter(([, v]) => v < 50)
    .sort((a, b) => a[1] - b[1])
    .map(([k, v]) => `${LABELS[k]}: ${v}%`);

  return { frequency, metrics, overall, highlights, concerns };
}
