/**
 * @myos/core/prediction — the Predictive Intelligence Engine (Sprint 6.2, Phase 6). A pure,
 * deterministic layer that forecasts likely futures (goals/deadlines/schedule/workload/study/
 * project/health/habits) from historical read models. **The OS predicts; the AI only explains.**
 * Predictions are immutable, confidence-scored, explainable, replayable, and never mutate data or
 * trigger automations. Forecasts bridge into 6.1 Prediction Signals for the Chief.
 */
export * from "./types";
export { movingAverage, slope, velocity, variability, computeTrend } from "./trend";
export { computeConfidence, confidenceWeight, type ConfidenceInput } from "./confidence";
export { probability, addDays, makePrediction, type ForecastDeps } from "./forecast";
export {
  forecastGoal,
  forecastDeadline,
  forecastSchedule,
  forecastWorkload,
  forecastStudy,
  forecastProject,
  forecastHealth,
  forecastHabit,
  type GoalForecastInput,
  type DeadlineForecastInput,
  type ScheduleForecastInput,
  type WorkloadForecastInput,
  type StudyForecastInput,
  type ProjectForecastInput,
  type HealthForecastInput,
  type HabitForecastInput,
} from "./models";
export { runPredictionEngine, type PredictionInput } from "./engine";
export { simulateScenario, type ScenarioKind, type ScenarioInput } from "./simulation";
export { buildPredictionTimeline } from "./timeline";
export { predictionToSignal, predictionSignals, type BridgeDeps } from "./signals";
export {
  byKind,
  riskForecasts,
  opportunityForecasts,
  chiefForecasts,
  forecastCounts,
} from "./selectors";
export {
  scenarioKindSchema,
  scenarioInputSchema,
  predictionKindSchema,
  type ScenarioInputSchema,
} from "./schemas";
