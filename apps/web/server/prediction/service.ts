import "server-only";
import type { Database } from "@myos/db";
import {
  runPredictionEngine,
  predictionSignals as bridgeToSignals,
  simulateScenario,
  buildPredictionTimeline,
  byKind,
  riskForecasts,
  opportunityForecasts,
  chiefForecasts,
  forecastCounts,
  type Prediction,
  type PredictionKind,
  type ScenarioInput,
} from "@myos/core/prediction";
import type { Signal } from "@myos/core/events";
import { gatherPredictionInput } from "./forecast";
import { loadActive, listHistory, recordRun, recordScenario } from "./repository";

/**
 * Prediction service (Sprint 6.2). Orchestrates a forecast run: gather historical read models → run
 * the deterministic engine → persist immutable predictions → return them. Owns no business logic and
 * mutates NO user data. The AI never participates. A run is on-demand (matching signals/notifications).
 */

let seq = 0;
const newId = () => `pred_${Date.now().toString(36)}_${(seq += 1).toString(36)}`;

/** Run a full forecast cycle and persist it. Returns the immutable predictions. */
export async function run(db: Database, tz: string, now = new Date()): Promise<Prediction[]> {
  const input = await gatherPredictionInput(db, tz, now);
  const predictions = runPredictionEngine(input, { newId, now });
  await recordRun(db, predictions, forecastCounts(predictions)).catch(() => {});
  return predictions;
}

/** prediction.current — all active forecasts + counts. */
export async function current(db: Database, tz: string) {
  const predictions = await run(db, tz);
  return {
    predictions,
    counts: forecastCounts(predictions),
    risks: riskForecasts(predictions),
    opportunities: opportunityForecasts(predictions),
  };
}

/** prediction.goals / schedule / health / projects — one domain's forecasts. */
export async function kind(db: Database, tz: string, k: PredictionKind) {
  return { predictions: byKind(await run(db, tz), k) };
}

/** prediction.timeline — past → current → forecast. */
export async function timeline(db: Database, tz: string, now = new Date()) {
  return { points: buildPredictionTimeline(await run(db, tz, now), now) };
}

/** prediction.history — recent predictions from persistence. */
export async function history(db: Database) {
  return { predictions: await listHistory(db).catch(() => []) };
}

/** prediction.simulate — a what-if against the current forecast. Never mutates plans. */
export async function simulate(
  db: Database,
  tz: string,
  input: ScenarioInput & { predictionId?: string },
) {
  const predictions = await loadActive(db).catch(() => [] as Prediction[]);
  const live = predictions.length ? predictions : await run(db, tz);
  const baseline =
    (input.predictionId ? live.find((p) => p.id === input.predictionId) : live[0]) ?? live[0];
  if (!baseline) return { result: null };
  const result = simulateScenario(baseline, {
    kind: input.kind,
    ...(input.amount !== undefined ? { amount: input.amount } : {}),
  });
  await recordScenario(db, baseline.id, result).catch(() => {});
  return { result, baseline: { id: baseline.id, headline: baseline.explanation.headline } };
}

/** prediction.forChief — the actionable forecasts the Chief should weigh. */
export async function forChief(db: Database, tz: string) {
  return chiefForecasts(await run(db, tz));
}

/**
 * Prediction Signals seam (Sprint 6.2). Bridge the forecast to 6.1 Signals so predictions flow
 * through the Event Intelligence Engine and reach the Chief. Fully guarded → [] on any failure.
 */
export async function predictionSignals(
  db: Database,
  tz: string,
  now = new Date(),
): Promise<Signal[]> {
  try {
    const predictions = await run(db, tz, now);
    return bridgeToSignals(predictions, { newId, now });
  } catch {
    return [];
  }
}
