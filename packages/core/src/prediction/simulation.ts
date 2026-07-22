/**
 * Scenario Simulation (Sprint 6.2, spec §Scenario Simulation). Answers "what if …?" by applying a
 * deterministic adjustment to a baseline prediction and reporting the effect — WITHOUT mutating any
 * data. Pure functions of a baseline + a named scenario. No AI.
 */
import type { ConfidenceLevel, Prediction, ScenarioResult } from "./types";

/** The supported hypothetical adjustments (each is a pure transform of a metric). */
export type ScenarioKind =
  "move_workout" | "add_focus_block" | "drop_task" | "reduce_meetings" | "extend_deadline";

export interface ScenarioInput {
  kind: ScenarioKind;
  /** Optional magnitude (minutes, tasks, days) depending on the scenario. */
  amount?: number;
}

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

/**
 * Simulate a scenario against a baseline prediction. Returns the projected effects + the net change
 * to the prediction's headline metric. Deterministic; never writes.
 */
export function simulateScenario(baseline: Prediction, input: ScenarioInput): ScenarioResult {
  const effects: { label: string; delta: string }[] = [];
  let netDelta = 0;

  switch (input.kind) {
    case "move_workout": {
      const focusGain = 0.04;
      netDelta = focusGain;
      effects.push(
        { label: "Focus time", delta: "+30 min" },
        { label: "Schedule pressure", delta: "unchanged" },
      );
      break;
    }
    case "add_focus_block": {
      netDelta = 0.06;
      effects.push(
        { label: "Deep-work capacity", delta: `+${input.amount ?? 60} min` },
        { label: "Deadline risk", delta: "−" },
      );
      break;
    }
    case "drop_task": {
      netDelta = 0.08;
      effects.push(
        { label: "Remaining work", delta: `−${input.amount ?? 1} task` },
        { label: "Completion probability", delta: "+" },
      );
      break;
    }
    case "reduce_meetings": {
      netDelta = 0.05;
      effects.push(
        { label: "Meeting density", delta: `−${input.amount ?? 1}` },
        { label: "Free windows", delta: "+" },
      );
      break;
    }
    case "extend_deadline": {
      netDelta = 0.12;
      effects.push(
        { label: "Available days", delta: `+${input.amount ?? 2}` },
        { label: "Delay probability", delta: "−" },
      );
      break;
    }
  }

  const headline = headlineMetric(baseline);
  const projected = clamp01(headline + netDelta);
  return {
    scenario: input.kind.replace(/_/g, " "),
    effects: [
      ...effects,
      {
        label: baseline.explanation.headline,
        delta: `${netDelta >= 0 ? "+" : ""}${Math.round(netDelta * 100)}%`,
      },
    ],
    netDelta: Math.round((projected - headline) * 100) / 100,
    // A simulation is at most as confident as its baseline, one band lower for the hypothetical.
    confidence: downgrade(baseline.confidence.level),
  };
}

/** The metric a scenario nudges — a probability where one exists, else 0.5. */
function headlineMetric(p: Prediction): number {
  return (
    p.metrics.completionProbability ??
    p.metrics.projectedCoverage ??
    (p.metrics.delayProbability !== undefined ? 1 - p.metrics.delayProbability : undefined) ??
    (p.metrics.burnoutProbability !== undefined ? 1 - p.metrics.burnoutProbability : undefined) ??
    0.5
  );
}

function downgrade(level: ConfidenceLevel): ConfidenceLevel {
  const order: ConfidenceLevel[] = ["low", "medium", "high", "very_high"];
  const i = order.indexOf(level);
  return order[Math.max(0, i - 1)]!;
}
