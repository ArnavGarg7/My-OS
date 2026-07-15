import "server-only";
import {
  buildDailySnapshot,
  buildReadiness,
  buildSummary as buildFocusSummary,
  computeMetrics,
  type FocusMetrics,
  type FocusReadiness,
  type FocusSummary,
} from "@myos/core/focus";
import { todayInTimeZone } from "@myos/core/today";
import type { Database } from "@myos/db";
import { buildSignals as buildHealthSignals } from "../health/summary";
import * as repo from "./repository";

/**
 * Focus summary/metrics/readiness assembly (Sprint 3.2). Derives everything from the
 * persisted sessions + Health signals (Sprint 2.9). Nothing is recomputed on the
 * health side — the readiness score comes straight from Health.
 */
export async function summary(db: Database, tz: string, now = new Date()): Promise<FocusSummary> {
  const date = todayInTimeZone(tz);
  const [active, sessions] = await Promise.all([
    repo.getActive(db).catch(() => null),
    repo.listByDate(db, date).catch(() => []),
  ]);
  return buildFocusSummary(active, sessions, now);
}

export async function metrics(db: Database, tz: string, now = new Date()): Promise<FocusMetrics> {
  const date = todayInTimeZone(tz);
  const sessions = await repo.listByDate(db, date).catch(() => []);
  return computeMetrics(sessions, now);
}

export async function readiness(
  db: Database,
  tz: string,
  now = new Date(),
): Promise<FocusReadiness> {
  const date = todayInTimeZone(tz);
  try {
    const health = await buildHealthSignals(db, date, now);
    return buildReadiness({
      score: health.readiness,
      hydrationPercent: health.hydrationPercent,
      recovery: health.recovery,
      sleepMinutes: health.sleepMinutes,
    });
  } catch {
    return buildReadiness(null);
  }
}

/** Persist the derived daily-summary cache for a date (reproducible from sessions). */
export async function persistDailySummary(
  db: Database,
  tz: string,
  now = new Date(),
): Promise<void> {
  const date = todayInTimeZone(tz);
  const sessions = await repo.listByDate(db, date).catch(() => []);
  const snap = buildDailySnapshot(date, sessions, now);
  await repo.upsertSummary(db, {
    summaryDate: snap.date,
    focusMinutes: snap.focusMinutes,
    deepWorkMinutes: snap.deepWorkMinutes,
    shallowMinutes: snap.shallowMinutes,
    breakMinutes: snap.breakMinutes,
    interruptions: snap.interruptions,
    sessions: snap.sessions,
    completedSessions: snap.completedSessions,
    longestSessionMinutes: snap.longestSessionMinutes,
    completionRate: Math.round(snap.completionRate),
    plannerAccuracy: Math.round(snap.plannerAccuracy),
  });
}
