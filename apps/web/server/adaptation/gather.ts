import "server-only";
import type { Database } from "@myos/db";
import type {
  AdaptationInput,
  FeedbackRecord,
  HabitObservation,
  Observation,
} from "@myos/core/adaptation";
import { listFeedback } from "./repository";

/**
 * Adaptation input gathering (Sprint 6.5). Assembles the deterministic `AdaptationInput` the engine
 * consumes: REAL recommendation feedback from the DB plus behavioral observations. Observations
 * eventually accrue from module read models via watchers; until that history exists this returns a
 * conservative, DETERMINISTIC offline observation set (mirroring the AI Local provider / connector
 * offline feed) so the profile/insights/reviews are exercisable end-to-end without invented history.
 * READ-ONLY — nothing here mutates user data. All time is injected.
 */

const DAY = 86_400_000;

/** A stable, deterministic observation seed (no randomness) representing recent behaviour. */
function seedObservations(now: Date): Observation[] {
  const daysAgo = (d: number) => new Date(now.getTime() - d * DAY).toISOString();
  const out: Observation[] = [];
  // Focus block length: consistently 90 minutes.
  for (let i = 0; i < 10; i += 1)
    out.push({ category: "focus", key: "focus_block_length", value: 90, at: daysAgo(i * 2) });
  // Study location: mostly the library.
  for (let i = 0; i < 8; i += 1)
    out.push({
      category: "learning",
      key: "study_location",
      value: i < 6 ? "library" : "home",
      at: daysAgo(i * 2 + 1),
    });
  // Preferred work hours: mostly mornings (numeric hour).
  for (let i = 0; i < 9; i += 1)
    out.push({
      category: "productivity",
      key: "preferred_work_hour",
      value: 9,
      at: daysAgo(i * 2),
    });
  // Focus hours metric: rising over time.
  for (let i = 0; i < 6; i += 1)
    out.push({
      category: "productivity",
      key: "focus_hours",
      value: 4 + i * 0.4,
      at: daysAgo(30 - i * 4),
    });
  // A weekly planning routine — 4 Mondays ~09:00 UTC.
  for (const d of [0, 7, 14, 21])
    out.push({
      category: "planning",
      key: "weekly_planning",
      value: "done",
      at: new Date(Date.UTC(2026, 5, 1 + d, 9, 0)).toISOString(),
    });
  return out;
}

/** A deterministic habit completion series (morning workout, mostly kept). */
function seedHabitSeries(now: Date): { key: string; series: HabitObservation[] }[] {
  const workout: HabitObservation[] = Array.from({ length: 21 }, (_, i) => ({
    date: new Date(now.getTime() - (20 - i) * DAY).toISOString().slice(0, 10),
    completed: i % 3 !== 0,
  }));
  return [{ key: "morning_workout", series: workout }];
}

/** Build the full deterministic adaptation input for one cycle. */
export async function gatherAdaptationInput(db: Database, now: Date): Promise<AdaptationInput> {
  const feedbackRows = await listFeedback(db).catch(() => []);
  const feedback: FeedbackRecord[] = feedbackRows.map((f) => ({
    proposalId: f.proposalId,
    subject: f.subject,
    type: f.type as FeedbackRecord["type"],
    at: f.at,
  }));
  return {
    observations: seedObservations(now),
    habitSeries: seedHabitSeries(now),
    feedback,
    now,
  };
}
