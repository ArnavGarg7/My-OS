import { IDEAL_SLEEP_MINUTES, MIN_HEALTHY_SLEEP_MINUTES, TREND_WINDOW_DAYS } from "./constants";
import type { SleepAnalysis, SleepSession } from "./types";

/**
 * Sleep engine (Sprint 2.9). Deterministic duration/consistency/debt/variance
 * scoring. Rule-based — no AI. A single night scores against the ideal window;
 * a history feeds rolling average, debt and bedtime/wake variance.
 */
const DAY_MS = 86_400_000;

/** Minutes-of-day (0–1439) for the clock time of an ISO instant. */
function minutesOfDay(iso: string): number {
  const d = new Date(iso);
  return d.getHours() * 60 + d.getMinutes();
}

/** Circular variance of clock times (handles wrap around midnight). */
export function clockVariance(isos: string[]): number {
  if (isos.length < 2) return 0;
  // Map each time to an angle, average the unit vectors, measure spread.
  const angles = isos.map((iso) => (minutesOfDay(iso) / 1440) * 2 * Math.PI);
  const sin = angles.reduce((s, a) => s + Math.sin(a), 0) / angles.length;
  const cos = angles.reduce((s, a) => s + Math.cos(a), 0) / angles.length;
  const r = Math.sqrt(sin * sin + cos * cos); // 0..1, 1 = perfectly consistent
  // Circular standard deviation in radians → minutes.
  const stdRad = Math.sqrt(-2 * Math.log(Math.max(r, 1e-9)));
  return Math.round((stdRad / (2 * Math.PI)) * 1440);
}

/** Score a single night's duration + quality against the ideal window. */
export function sleepScore(session: SleepSession): number {
  const duration = session.durationMinutes;
  // Duration component: full marks at/above ideal, linear penalty below min.
  let durationScore: number;
  if (duration >= IDEAL_SLEEP_MINUTES) {
    // Slight penalty for large oversleep (> 10h).
    durationScore = duration > 600 ? Math.max(70, 100 - (duration - 600) / 6) : 100;
  } else if (duration >= MIN_HEALTHY_SLEEP_MINUTES) {
    durationScore =
      80 +
      ((duration - MIN_HEALTHY_SLEEP_MINUTES) / (IDEAL_SLEEP_MINUTES - MIN_HEALTHY_SLEEP_MINUTES)) *
        20;
  } else {
    durationScore = Math.max(0, (duration / MIN_HEALTHY_SLEEP_MINUTES) * 80);
  }
  // Blend 70% duration, 30% self-rated quality.
  return Math.round(durationScore * 0.7 + Math.max(0, Math.min(100, session.quality)) * 0.3);
}

export function durationBetween(bedTime: string, wakeTime: string): number {
  const diff = new Date(wakeTime).getTime() - new Date(bedTime).getTime();
  return Math.max(0, Math.round(diff / 60000));
}

/** Rolling average of the most recent `window` sessions' durations. */
export function rollingAverage(sessions: SleepSession[], window = TREND_WINDOW_DAYS): number {
  if (sessions.length === 0) return 0;
  const recent = [...sessions].sort((a, b) => a.wakeTime.localeCompare(b.wakeTime)).slice(-window);
  return Math.round(recent.reduce((s, x) => s + x.durationMinutes, 0) / recent.length);
}

/** Cumulative sleep debt vs the ideal over the window (min, clamped ≥ 0). */
export function sleepDebt(sessions: SleepSession[], window = TREND_WINDOW_DAYS): number {
  const recent = [...sessions].sort((a, b) => a.wakeTime.localeCompare(b.wakeTime)).slice(-window);
  const debt = recent.reduce((s, x) => s + (IDEAL_SLEEP_MINUTES - x.durationMinutes), 0);
  return Math.max(0, debt);
}

export function analyzeSleep(
  latest: SleepSession | null,
  history: SleepSession[] = [],
): SleepAnalysis | null {
  if (!latest) return null;
  const all = [...history];
  if (!all.some((s) => s.id === latest.id)) all.push(latest);
  const bedVariance = clockVariance(all.map((s) => s.bedTime));
  const wakeVariance = clockVariance(all.map((s) => s.wakeTime));
  // Consistency: lower combined variance → higher consistency.
  const consistency = Math.max(0, Math.round(100 - (bedVariance + wakeVariance) / 4));
  return {
    durationMinutes: latest.durationMinutes,
    score: sleepScore(latest),
    debtMinutes: sleepDebt(all),
    rollingAverageMinutes: rollingAverage(all),
    bedtimeVarianceMinutes: bedVariance,
    wakeVarianceMinutes: wakeVariance,
    consistency,
  };
}

export const SLEEP_DAY_MS = DAY_MS;
