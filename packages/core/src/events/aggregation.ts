/**
 * Signal Aggregation (Sprint 6.1). Prevents spam by collapsing many same-category signals into one
 * summary signal (spec §Signal Aggregation: "5 missed tasks → one 'schedule slipping'"). Pure.
 */
import type { Signal, SignalCategory } from "./types";
import { AGGREGATION_THRESHOLD } from "./constants";

export interface AggregateDeps {
  newId: () => string;
}

/** Categories that are meaningful to aggregate (transient, high-volume). */
const AGGREGATABLE: SignalCategory[] = ["productivity", "planning", "risks"];

/**
 * Collapse groups of ≥ AGGREGATION_THRESHOLD signals sharing (source, category) into a single
 * summary signal that references them; other signals pass through untouched. Deterministic — input
 * order preserved, summary inherits the highest severity of its group.
 */
export function aggregateSignals(signals: readonly Signal[], deps: AggregateDeps): Signal[] {
  const groups = new Map<string, Signal[]>();
  const passthrough: Signal[] = [];

  for (const s of signals) {
    if (AGGREGATABLE.includes(s.category)) {
      const key = `${s.source}:${s.category}`;
      const arr = groups.get(key) ?? [];
      arr.push(s);
      groups.set(key, arr);
    } else {
      passthrough.push(s);
    }
  }

  const out: Signal[] = [...passthrough];
  for (const [key, group] of groups) {
    if (group.length < AGGREGATION_THRESHOLD) {
      out.push(...group);
      continue;
    }
    const first = group[0]!;
    const highest = severest(group);
    out.push({
      ...first,
      id: deps.newId(),
      severity: highest,
      confidence: Math.max(...group.map((g) => g.confidence)),
      explanation: {
        headline: summaryHeadline(first.category),
        reasons: [`${group.length} related ${first.category} signals`, "Collapsed to reduce noise"],
        implication: "A pattern is forming — worth one deliberate response.",
      },
      relatedObjects: group.flatMap((g) => g.relatedObjects),
      eventIds: group.flatMap((g) => g.eventIds),
      dedupeKey: `${key}:aggregate`,
    });
  }
  return out;
}

const ORDER = ["info", "low", "medium", "high", "critical"] as const;
function severest(group: readonly Signal[]): Signal["severity"] {
  return group.reduce<Signal["severity"]>(
    (max, s) => (ORDER.indexOf(s.severity) > ORDER.indexOf(max) ? s.severity : max),
    "info",
  );
}

function summaryHeadline(category: SignalCategory): string {
  switch (category) {
    case "planning":
      return "Schedule slipping";
    case "productivity":
      return "Productivity pattern";
    case "risks":
      return "Multiple risks emerging";
    default:
      return "Related signals";
  }
}
