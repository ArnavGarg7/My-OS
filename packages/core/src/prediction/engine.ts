/**
 * Prediction Engine — orchestrator (Sprint 6.2). Runs the forecast models over the historical inputs
 * the SERVER assembled from frozen module read models, producing immutable Predictions. Pure — no IO,
 * no clock (all time via `now`), no AI. This is the "Forecast Models" stage of the pipeline; the
 * server bridges the output into Prediction Signals for the 6.1 engine and the Chief.
 */
import type { Prediction } from "./types";
import type { ForecastDeps } from "./forecast";
import {
  forecastDeadline,
  forecastGoal,
  forecastHabit,
  forecastHealth,
  forecastProject,
  forecastSchedule,
  forecastStudy,
  forecastWorkload,
  type DeadlineForecastInput,
  type GoalForecastInput,
  type HabitForecastInput,
  type HealthForecastInput,
  type ProjectForecastInput,
  type ScheduleForecastInput,
  type StudyForecastInput,
  type WorkloadForecastInput,
} from "./models";

/** Everything the models need, already derived from read models by the server. All optional. */
export interface PredictionInput {
  goals?: GoalForecastInput[];
  deadlines?: DeadlineForecastInput[];
  schedule?: ScheduleForecastInput;
  workload?: WorkloadForecastInput;
  study?: StudyForecastInput[];
  projects?: ProjectForecastInput[];
  health?: HealthForecastInput;
  habits?: HabitForecastInput[];
}

/** Run every applicable model. Deterministic given inputs + deps. Order is stable. */
export function runPredictionEngine(input: PredictionInput, deps: ForecastDeps): Prediction[] {
  const out: Prediction[] = [];
  for (const g of input.goals ?? []) out.push(forecastGoal(g, deps));
  for (const d of input.deadlines ?? []) out.push(forecastDeadline(d, deps));
  if (input.schedule) out.push(forecastSchedule(input.schedule, deps));
  if (input.workload) out.push(forecastWorkload(input.workload, deps));
  for (const s of input.study ?? []) out.push(forecastStudy(s, deps));
  for (const p of input.projects ?? []) out.push(forecastProject(p, deps));
  if (input.health) out.push(forecastHealth(input.health, deps));
  for (const h of input.habits ?? []) out.push(forecastHabit(h, deps));
  return out;
}
