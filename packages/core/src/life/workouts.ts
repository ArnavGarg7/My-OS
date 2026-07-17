import { HIGH_TRAINING_LOAD } from "./constants";
import type { TrainingLoad, WorkoutSession, WorkoutSet } from "./types";

/**
 * Workout platform (Sprint 4.2). Pure deterministic training metrics — set volume,
 * training load, weekly volume, PR tracking. No estimation models; everything is a
 * direct calculation from logged sets.
 */

/** Volume for one set = reps × weight (kg·reps). Bodyweight/cardio sets use duration×intensity. */
export function setVolume(set: WorkoutSet): number {
  if (set.weight > 0 && set.reps > 0) return set.reps * set.weight;
  return set.durationMinutes * set.intensity;
}

/** Total volume for a session. */
export function sessionVolume(session: WorkoutSession): number {
  return session.sets.reduce((n, s) => n + setVolume(s), 0);
}

/** Session training load = volume × perceived exertion (a deterministic load proxy). */
export function sessionLoad(session: WorkoutSession): number {
  return Math.round(sessionVolume(session) * (session.perceivedExertion / 10));
}

function ymd(d: Date): string {
  return d.toISOString().slice(0, 10);
}
function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setUTCDate(x.getUTCDate() + n);
  return x;
}

/** Sessions within the last 7 days. */
export function sessionsThisWeek(sessions: WorkoutSession[], now: Date): WorkoutSession[] {
  const start = new Date(`${ymd(addDays(now, -6))}T00:00:00Z`).getTime();
  return sessions.filter((s) => new Date(`${s.date}T00:00:00Z`).getTime() >= start);
}

/** Weekly training load: volume + sessions + average intensity, with a high-load flag. */
export function trainingLoad(sessions: WorkoutSession[], now: Date): TrainingLoad {
  const week = sessionsThisWeek(sessions, now);
  const weeklyVolume = week.reduce((n, s) => n + sessionVolume(s), 0);
  const totalIntensity = week.reduce((n, s) => n + s.perceivedExertion, 0);
  return {
    weeklyVolume: Math.round(weeklyVolume),
    sessions: week.length,
    averageIntensity: week.length > 0 ? Number((totalIntensity / week.length).toFixed(1)) : 0,
    high: weeklyVolume >= HIGH_TRAINING_LOAD,
  };
}

/** Personal record (max weight) per exercise across all logged sets. */
export function personalRecords(sessions: WorkoutSession[]): Map<string, number> {
  const prs = new Map<string, number>();
  for (const s of sessions) {
    for (const set of s.sets) {
      const best = prs.get(set.exerciseId) ?? 0;
      if (set.weight > best) prs.set(set.exerciseId, set.weight);
    }
  }
  return prs;
}

/** Whether a session set a new PR for any exercise vs prior sessions. */
export function isPR(session: WorkoutSession, prior: WorkoutSession[]): boolean {
  const priorPRs = personalRecords(prior);
  return session.sets.some(
    (set) => set.weight > (priorPRs.get(set.exerciseId) ?? 0) && set.weight > 0,
  );
}
