import { correlate } from "./correlations";
import type { Correlation, HealthDaily, SleepSession, Workout } from "./types";

/**
 * Health selectors (Sprint 2.9). Pure read helpers + the deterministic
 * correlation set surfaced in the UI (sleep↔energy, hydration↔focus, etc.).
 */
export function dailyByDate(dailies: HealthDaily[], date: string): HealthDaily | null {
  return dailies.find((d) => d.date === date) ?? null;
}

export function sleepForNight(sessions: SleepSession[], date: string): SleepSession | null {
  // The session whose wake time falls on `date`.
  return (
    sessions
      .filter((s) => s.wakeTime.slice(0, 10) === date)
      .sort((a, b) => b.wakeTime.localeCompare(a.wakeTime))[0] ?? null
  );
}

export function workoutsOn(workouts: Workout[], date: string): Workout[] {
  return workouts.filter((w) => w.startedAt.slice(0, 10) === date);
}

/** Energy level as a 0–2 ordinal for correlation math. */
function energyOrdinal(d: HealthDaily): number | null {
  if (!d.energyLevel) return null;
  return d.energyLevel === "low" ? 0 : d.energyLevel === "medium" ? 1 : 2;
}

/**
 * Standard health correlations from a daily history + sleep sessions. Aligns
 * series by date; only days present in both are used.
 */
export function standardCorrelations(
  dailies: HealthDaily[],
  sessions: SleepSession[],
): Correlation[] {
  const byDate = new Map(dailies.map((d) => [d.date, d]));
  const sleepByDate = new Map<string, number>();
  for (const s of sessions) sleepByDate.set(s.wakeTime.slice(0, 10), s.durationMinutes);

  const days = [...byDate.keys()].filter((d) => sleepByDate.has(d)).sort();

  const sleepMinutes: number[] = [];
  const energy: number[] = [];
  const water: number[] = [];
  const protein: number[] = [];
  for (const day of days) {
    const d = byDate.get(day)!;
    const ord = energyOrdinal(d);
    if (ord === null) continue;
    sleepMinutes.push(sleepByDate.get(day)!);
    energy.push(ord);
    water.push(d.waterMl);
    protein.push(d.protein);
  }

  return [
    correlate("sleep", sleepMinutes, "energy", energy),
    correlate("hydration", water, "energy", energy),
    correlate("protein", protein, "energy", energy),
  ];
}
