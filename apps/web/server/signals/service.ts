import "server-only";
import type { Database } from "@myos/db";
import {
  runEngine,
  rankSignals,
  currentSignals,
  todaySignals,
  riskSignals,
  opportunitySignals,
  chiefInput,
  signalCounts,
  groupByWindow,
  type DomainEvent,
  type RankedSignal,
} from "@myos/core/events";
import { gatherWatcherInputs } from "./watchers";
import { predictionSignals as predictionSignalsSeam } from "../prediction/service";
import {
  acknowledgeSignal,
  listHistory,
  listTimeline,
  loadActiveSignals,
  loadSubscription,
  recordCycle,
  saveSubscription,
} from "./repository";

/**
 * Signals service (Sprint 6.1). Orchestrates one Event-Intelligence cycle: watchers observe frozen
 * read models → the deterministic engine generates/ranks/aggregates/suppresses → persist the
 * immutable result → return ranked signals. Owns no business logic; nothing here mutates user data.
 * A cycle runs on-demand (matching the notification/automation pattern — no background loop yet).
 */

let seq = 0;
const newId = () => `sig_${Date.now().toString(36)}_${(seq += 1).toString(36)}`;

/** Run a full cycle (optionally seeded with explicit events) and persist it. Returns ranked signals. */
export async function run(
  db: Database,
  tz: string,
  extraEvents: DomainEvent[] = [],
  now = new Date(),
): Promise<RankedSignal[]> {
  const inputs = await gatherWatcherInputs(db, tz, now);
  const previous = await loadActiveSignals(db).catch(() => []);
  // Sprint 6.2: the Predictive Intelligence Engine's forecast signals join the cycle as extraSignals,
  // flowing through the identical aggregate → suppress → rank → notify pipeline. Guarded → [].
  const forecastSignals = await predictionSignalsSeam(db, tz, now).catch(() => []);
  const result = runEngine(
    {
      events: [...inputs.events, ...extraEvents],
      risk: inputs.risk,
      opportunity: inputs.opportunity,
      extraSignals: forecastSignals,
      previous,
    },
    { newId, now },
  );
  await recordCycle(db, result).catch(() => {});
  return result.signals;
}

/** signals.current — all active signals, highest priority first. */
export async function current(db: Database, tz: string) {
  const signals = await run(db, tz);
  return { signals: currentSignals(signals), counts: signalCounts(signals) };
}

/** signals.today — current + today window. */
export async function today(db: Database, tz: string) {
  const signals = await run(db, tz);
  return { signals: todaySignals(signals), windows: groupByWindow(signals) };
}

/** signals.risks — risk signals only. */
export async function risks(db: Database, tz: string) {
  return { signals: riskSignals(await run(db, tz)) };
}

/** signals.opportunities — opportunity signals only. */
export async function opportunities(db: Database, tz: string) {
  return { signals: opportunitySignals(await run(db, tz)) };
}

/** signals.forChief — the top signals the Chief consumes as primary situational awareness. */
export async function forChief(db: Database, tz: string, limit = 8) {
  return chiefInput(await run(db, tz), limit);
}

/** signals.timeline — the replay/audit trail. */
export async function timeline(db: Database, signalId?: string) {
  const rows = await listTimeline(db, signalId).catch(() => []);
  return rows.map((r) => ({
    signalId: r.signalId,
    kind: r.kind,
    detail: r.detail,
    at: r.at.toISOString(),
  }));
}

/** signals.history — recent signals (any status). */
export async function history(db: Database) {
  const rows = await listHistory(db).catch(() => []);
  return rankSignals(rows, new Date());
}

/** signals.subscribe — read/update the subscription preferences. */
export async function subscribe(db: Database, input?: { categories: string[]; minLevel: string }) {
  if (input) {
    await saveSubscription(db, input.categories, input.minLevel).catch(() => {});
    return { ok: true, ...input };
  }
  const sub = (await loadSubscription(db).catch(() => null)) ?? {
    categories: [],
    minLevel: "suggestion",
  };
  return { ok: true, ...sub };
}

/** signals.acknowledge — dismiss an active signal (lifecycle status only; no data mutated). */
export async function acknowledge(db: Database, signalId: string) {
  await acknowledgeSignal(db, signalId).catch(() => {});
  return { ok: true };
}

/**
 * Chief seam (Sprint 6.1). Map the current signals onto the Chief's existing `disruptions` shape so
 * the Chief consumes the Signal Engine as its situational awareness rather than re-deriving it.
 * Fully guarded — ANY failure yields an empty list so the Chief always answers unchanged.
 */
export async function signalDisruptions(
  db: Database,
  tz: string,
  now = new Date(),
  extraEvents: DomainEvent[] = [],
): Promise<
  {
    kind: "free_time" | "low_energy" | "cancelled_event" | "manual";
    detail: string;
    minutes?: number;
  }[]
> {
  try {
    const signals = await run(db, tz, extraEvents, now);
    const out: {
      kind: "free_time" | "low_energy" | "cancelled_event" | "manual";
      detail: string;
      minutes?: number;
    }[] = [];
    for (const s of signals) {
      // Only STATE-based risk signals map to Chief disruptions. Freed-time disruptions come from an
      // actual cancellation EVENT (see extraEvents), never from the ambient absence of meetings —
      // otherwise every quiet calendar would look like a disruption.
      if (s.category === "risks" && s.explanation.headline === "Burnout risk") {
        out.push({ kind: "low_energy", detail: s.explanation.reasons[0] ?? "Low readiness" });
      } else if (
        s.source === "calendar" &&
        s.category === "opportunities" &&
        s.eventIds.length > 0
      ) {
        const mins = Number(/(\d+)-minute/.exec(s.explanation.headline)?.[1] ?? 0);
        out.push({
          kind: "free_time",
          detail: s.explanation.headline,
          ...(mins ? { minutes: mins } : {}),
        });
      }
    }
    return out;
  } catch {
    return [];
  }
}
