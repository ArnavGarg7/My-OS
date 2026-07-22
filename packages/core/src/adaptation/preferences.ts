/**
 * Preference Learning (Sprint 6.5, spec §Preference Learning). Deterministically infers stable
 * preferences from grouped observations: the dominant value (mode) becomes the preference, its share
 * of the evidence becomes consistency, and the Confidence Engine scores it. Explicit observations
 * outweigh implicit ones. Every preference links to evidence and is user-editable/disableable. Pure —
 * no AI, no clock (now is passed in).
 */
import type { Observation, Preference } from "./types";
import { computeConfidence } from "./confidence";

const DAY_MS = 86_400_000;

/** Learn one preference per observation key. Returns preferences sorted by confidence (desc). */
export function learnPreferences(observations: readonly Observation[], now: Date): Preference[] {
  const byKey = new Map<string, Observation[]>();
  for (const o of observations) {
    const arr = byKey.get(o.key) ?? [];
    arr.push(o);
    byKey.set(o.key, arr);
  }

  const prefs: Preference[] = [];
  for (const [key, obs] of byKey) {
    const pref = learnOne(key, obs, now);
    if (pref) prefs.push(pref);
  }
  return prefs.sort((a, b) => b.confidence.score - a.confidence.score);
}

function learnOne(key: string, obs: Observation[], now: Date): Preference | null {
  if (obs.length === 0) return null;

  // Weighted tally of each distinct value (explicit weighs more than implicit).
  const tally = new Map<string, number>();
  let total = 0;
  let anyExplicit = false;
  for (const o of obs) {
    const w = o.weight ?? 1;
    const v = String(o.value);
    tally.set(v, (tally.get(v) ?? 0) + w);
    total += w;
    if ((o.weight ?? 1) > 1) anyExplicit = true;
  }

  // The mode (dominant value). Deterministic tie-break by value string.
  let bestValue = "";
  let bestWeight = -1;
  for (const [v, w] of [...tally.entries()].sort(
    (a, b) => b[1] - a[1] || a[0].localeCompare(b[0]),
  )) {
    if (w > bestWeight) {
      bestWeight = w;
      bestValue = v;
    }
  }

  const consistency = total > 0 ? bestWeight / total : 0;
  const contradictions = obs.filter((o) => String(o.value) !== bestValue).length;

  const times = obs.map((o) => new Date(o.at).getTime()).sort((a, b) => a - b);
  const timeSpanDays = (times[times.length - 1]! - times[0]!) / DAY_MS;
  const recencyDays = (now.getTime() - times[times.length - 1]!) / DAY_MS;

  const confidence = computeConfidence({
    observations: obs.length,
    consistency,
    timeSpanDays,
    contradictions,
    recencyDays,
  });

  // Preserve the original type (number vs string) when the value is numeric.
  const numeric = Number(bestValue);
  const value: string | number = bestValue !== "" && !Number.isNaN(numeric) ? numeric : bestValue;

  return {
    key,
    category: obs[0]!.category,
    value,
    confidence,
    evidence: {
      observations: obs.length,
      timeSpanDays: Math.round(timeSpanDays),
      source: anyExplicit ? "explicit" : "implicit",
      detail: `chose "${bestValue}" in ${Math.round(consistency * 100)}% of ${obs.length} observations`,
    },
    enabled: true,
    source: anyExplicit ? "explicit" : "implicit",
  };
}
