/**
 * Event Intelligence Engine — orchestrator (Sprint 6.1). Composes the pure stages into one
 * deterministic pass:
 *
 *   events + detection contexts + previous signals
 *     → generate → detect(risks/opportunities) → aggregate → suppress → rank → notify
 *     → { active RankedSignal[], transitions, timeline }
 *
 * No IO, no clock (all time via `now`), no AI. Signals never mutate user data.
 */
import type { DomainEvent, RankedSignal, Signal, SignalTimelineEntry } from "./types";
import { generateSignals } from "./generator";
import { detectRisks, type RiskContext } from "./risk";
import { detectOpportunities, type OpportunityContext } from "./opportunity";
import { aggregateSignals } from "./aggregation";
import { suppressSignals } from "./suppression";
import { rankSignal } from "./ranking";
import { decideNotification } from "./notifications";

export interface EngineInput {
  events: readonly DomainEvent[];
  risk?: RiskContext | undefined;
  opportunity?: OpportunityContext | undefined;
  /** Previously-known signals (for suppression/supersede/expiry). */
  previous?: readonly Signal[] | undefined;
  /**
   * Pre-built signals from other deterministic producers (Sprint 6.2 Prediction Engine feeds its
   * forecast-derived Prediction Signals here). Merged with the generated set before aggregate →
   * suppress → rank, so they flow through the identical pipeline. Never AI-produced.
   */
  extraSignals?: readonly Signal[] | undefined;
}

export interface EngineDeps {
  newId: () => string;
  now: Date;
}

export interface EngineResult {
  /** Active, ranked, notification-decided signals — sorted by priority desc. */
  signals: RankedSignal[];
  /** Status transitions (expired/superseded) for the timeline. */
  transitions: { signalId: string; to: "expired" | "superseded" }[];
  /** New timeline entries produced this cycle. */
  timeline: SignalTimelineEntry[];
}

/** Run one intelligence cycle. Deterministic given inputs + deps. */
export function runEngine(input: EngineInput, deps: EngineDeps): EngineResult {
  const timeline: SignalTimelineEntry[] = [];
  const at = deps.now.toISOString();

  for (const e of input.events) {
    timeline.push({ signalId: e.id, at, kind: "event_received", detail: `${e.source}:${e.kind}` });
  }

  // 1. Generate from events + detect from context snapshots + merge externally-produced signals
  //    (e.g. the Prediction Engine's forecast signals — deterministic, never AI).
  const generated: Signal[] = [
    ...generateSignals(input.events, deps),
    ...(input.risk ? detectRisks(input.risk, deps) : []),
    ...(input.opportunity ? detectOpportunities(input.opportunity, deps) : []),
    ...(input.extraSignals ?? []),
  ];

  // 2. Aggregate to avoid spam.
  const aggregated = aggregateSignals(generated, deps);

  // 3. Suppress duplicates / expire / supersede / escalate against prior state.
  const { active, transitions } = suppressSignals(aggregated, input.previous ?? [], deps.now);

  for (const t of transitions) {
    timeline.push({
      signalId: t.signal.id,
      at,
      kind: t.to,
      detail: t.to === "expired" ? "past expiry" : "replaced by a newer signal",
    });
  }

  // 4. Rank + decide notification.
  const ranked: RankedSignal[] = active.map((s) => {
    const ranking = rankSignal(s, deps.now);
    return { ...s, ranking, notify: decideNotification(ranking, s.severity) };
  });
  ranked.sort(
    (a, b) => b.ranking.priority - a.ranking.priority || b.createdAt.localeCompare(a.createdAt),
  );

  for (const s of ranked) {
    timeline.push({ signalId: s.id, at, kind: "signal_created", detail: s.explanation.headline });
    timeline.push({
      signalId: s.id,
      at,
      kind: "signal_ranked",
      detail: `priority ${s.ranking.priority}`,
    });
    if (s.notify !== "silent") {
      timeline.push({ signalId: s.id, at, kind: "notified", detail: s.notify });
    }
  }

  return {
    signals: ranked,
    transitions: transitions.map((t) => ({ signalId: t.signal.id, to: t.to })),
    timeline,
  };
}
