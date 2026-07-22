/**
 * Routine Discovery (Sprint 6.5, spec §Routine Discovery). Deterministically discovers recurring
 * routines (e.g. Monday planning, Friday review, evening gym) from dated, labelled observations by
 * clustering on day-of-week + hour and requiring repeated evidence. Pure — no AI, no clock. A pattern
 * only becomes a routine once it recurs at least MIN_OCCURRENCES times.
 */
import type { Observation, RoutineModel } from "./types";
import { computeConfidence } from "./confidence";

const DAY_MS = 86_400_000;
const MIN_OCCURRENCES = 3;

/**
 * Discover routines from observations. Each observation's `key` is the routine label; its timestamp
 * gives the day-of-week + hour. Observations that cluster on the same (label, dow, hour-bucket) and
 * recur enough become routines.
 */
export function discoverRoutines(observations: readonly Observation[], now: Date): RoutineModel[] {
  // Bucket by label + day-of-week + hour.
  const buckets = new Map<string, { label: string; dow: number; hour: number; times: number[] }>();
  for (const o of observations) {
    const d = new Date(o.at);
    const dow = d.getUTCDay();
    const hour = d.getUTCHours();
    const bucketKey = `${o.key}|${dow}|${hour}`;
    const b = buckets.get(bucketKey) ?? { label: o.key, dow, hour, times: [] };
    b.times.push(d.getTime());
    buckets.set(bucketKey, b);
  }

  const routines: RoutineModel[] = [];
  for (const [, b] of buckets) {
    if (b.times.length < MIN_OCCURRENCES) continue;
    const times = [...b.times].sort((a, z) => a - z);
    const timeSpanDays = (times[times.length - 1]! - times[0]!) / DAY_MS;
    const recencyDays = (now.getTime() - times[times.length - 1]!) / DAY_MS;
    // Consistency: a routine seen many times across a broad span is more consistent.
    const consistency = Math.min(1, b.times.length / 8);
    const confidence = computeConfidence({
      observations: b.times.length,
      consistency,
      timeSpanDays,
      contradictions: 0,
      recencyDays,
    });
    routines.push({
      key: `${b.label}@${b.dow}:${b.hour}`,
      dayOfWeek: b.dow,
      hour: b.hour,
      label: b.label,
      occurrences: b.times.length,
      confidence,
      evidence: {
        observations: b.times.length,
        timeSpanDays: Math.round(timeSpanDays),
        source: "implicit",
        detail: `${b.label} recurred ${b.times.length}× on ${DOW[b.dow]} ~${b.hour}:00`,
      },
    });
  }
  return routines.sort((a, z) => z.confidence.score - a.confidence.score);
}

const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
