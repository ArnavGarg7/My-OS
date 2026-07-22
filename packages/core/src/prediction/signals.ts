/**
 * Prediction → Signal bridge (Sprint 6.2, spec §Prediction Signals). Converts actionable forecasts
 * (at-risk / opportunity) into immutable Signals of the 6.1 Event Intelligence Engine, so predictions
 * flow through the identical aggregate → suppress → rank → notify pipeline and reach the Chief. Pure;
 * the confidence + explanation come straight from the deterministic forecast — the AI never predicts.
 */
import type {
  EventSource,
  Signal,
  SignalCategory,
  ContextWindow,
  SignalSeverity,
} from "../events/types";
import type { Prediction, PredictionKind } from "./types";

export interface BridgeDeps {
  newId: () => string;
  now: Date;
}

/** Which module "owns" each prediction kind (for the Signal's source). */
const KIND_SOURCE: Record<PredictionKind, EventSource> = {
  goal: "goal",
  deadline: "task",
  schedule: "calendar",
  workload: "health",
  study: "knowledge",
  project: "project",
  health: "health",
  habit: "health",
};

/** Horizon (days) → context window. */
function windowFor(horizonDays: number): ContextWindow {
  if (horizonDays <= 0) return "current";
  if (horizonDays <= 1) return "today";
  if (horizonDays <= 2) return "tomorrow";
  if (horizonDays <= 7) return "week";
  return "long_term";
}

/** Confidence + outlook → severity. */
function severityFor(p: Prediction): SignalSeverity {
  if (p.outlook !== "at_risk") return "low";
  if (p.confidence.score >= 0.8) return "critical";
  if (p.confidence.score >= 0.6) return "high";
  return "medium";
}

/**
 * Turn a prediction into a Prediction Signal, or null when the forecast isn't actionable (on-track /
 * neutral produce no signal — silence is valid). Confidence carries through so the feed shows e.g.
 * "Future deadline risk · 91%".
 */
export function predictionToSignal(p: Prediction, deps: BridgeDeps): Signal | null {
  if (p.outlook !== "at_risk" && p.outlook !== "opportunity") return null;
  const category: SignalCategory = p.outlook === "at_risk" ? "risks" : "opportunities";
  const source = KIND_SOURCE[p.kind];
  const window = windowFor(p.horizonDays);
  return {
    id: deps.newId(),
    source,
    category,
    severity: severityFor(p),
    confidence: p.confidence.score,
    createdAt: deps.now.toISOString(),
    expiresAt: new Date(deps.now.getTime() + Math.max(1, p.horizonDays) * 86_400_000).toISOString(),
    window,
    explanation: {
      headline: `Forecast: ${p.explanation.headline}`,
      reasons: p.explanation.calculations.map((c) => `${c.label}: ${c.value}`),
      implication: p.explanation.implication,
    },
    relatedObjects: p.relatedObjects,
    eventIds: [],
    status: "active",
    dedupeKey: `${source}:${category}:prediction:${p.dedupeKey}`,
  };
}

/** Bridge a batch of predictions to signals (nulls dropped). */
export function predictionSignals(predictions: readonly Prediction[], deps: BridgeDeps): Signal[] {
  const out: Signal[] = [];
  for (const p of predictions) {
    const s = predictionToSignal(p, deps);
    if (s) out.push(s);
  }
  return out;
}
