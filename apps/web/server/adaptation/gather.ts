import "server-only";
import type { Database } from "@myos/db";
import type {
  AdaptationInput,
  FeedbackRecord,
  HabitObservation,
  Observation,
} from "@myos/core/adaptation";
import { focusMinutesAt } from "@myos/core/focus";
import * as focusService from "../focus/service";
import * as taskService from "../task/service";
import * as goalService from "../goal/service";
import { listFeedback } from "./repository";

/**
 * Adaptation input gathering (Sprint 6.5; REAL behavioural learning added in Stage 5).
 *
 * Assembles the deterministic `AdaptationInput` the engine consumes from the user's
 * OWN frozen records — completed focus sessions, completed tasks, and real habit
 * completion series — plus real recommendation feedback. Nothing is invented: an
 * observation exists only because a real record exists. When there is little
 * history the engine's confidence bands report "not enough evidence yet" — which
 * is the correct, honest result, not a fabricated pattern.
 *
 * READ-ONLY — nothing here mutates user data. All time is injected. Modules
 * translate their frozen read models into `Observation`s; the engine never reads a
 * module directly, keeping the personalization layer provider-agnostic.
 */

const DAY = 86_400_000;

/** Local hour (0..23) of an ISO instant. */
function hourOf(iso: string): number {
  return new Date(iso).getHours();
}

/**
 * Behavioural observations derived from real records. Every emitted observation is
 * backed by a concrete completed session/task — no seeds, no placeholders.
 */
async function realObservations(db: Database, now: Date): Promise<Observation[]> {
  const out: Observation[] = [];
  const windowStart = now.getTime() - 90 * DAY;

  // ── Focus sessions: block length + when the user actually does deep work ──────
  const sessions = await focusService.history(db, 200).catch(() => []);
  for (const s of sessions) {
    if (!s.startedAt || !s.completed) continue;
    const started = new Date(s.startedAt).getTime();
    if (started < windowStart) continue;
    const minutes = focusMinutesAt(s, s.endedAt ? new Date(s.endedAt) : now);
    if (minutes > 0) {
      out.push({
        category: "focus",
        key: "focus_block_length",
        value: minutes,
        at: s.endedAt ?? s.startedAt,
      });
    }
    out.push({
      category: "productivity",
      key: "preferred_work_hour",
      value: hourOf(s.startedAt),
      at: s.startedAt,
    });
  }

  // ── Completed tasks: when work gets finished (a second, independent signal) ───
  const tasks = await taskService.list(db, {}).catch(() => []);
  for (const t of tasks) {
    if (t.status !== "completed" || !t.completedAt) continue;
    if (new Date(t.completedAt).getTime() < windowStart) continue;
    out.push({
      category: "productivity",
      key: "preferred_work_hour",
      value: hourOf(t.completedAt),
      at: t.completedAt,
    });
  }

  return out;
}

/** Real habit completion series from the Goal engine (day-granularity, no synthesis). */
async function realHabitSeries(
  db: Database,
): Promise<{ key: string; series: HabitObservation[] }[]> {
  const habits = await goalService.habits(db).catch(() => []);
  return habits
    .filter((h) => h.history.length > 0)
    .map((h) => {
      const done = new Set(h.history);
      const dates = [...h.history].sort();
      const first = dates[0]!;
      const last = dates[dates.length - 1]!;
      // Dense daily series across the observed span so the engine can measure gaps.
      const series: HabitObservation[] = [];
      for (let t = new Date(first).getTime(); t <= new Date(last).getTime(); t += DAY) {
        const date = new Date(t).toISOString().slice(0, 10);
        series.push({ date, completed: done.has(date) });
      }
      return { key: h.title.toLowerCase().replace(/\s+/g, "_"), series };
    });
}

/** Build the full adaptation input for one cycle — all from real data. */
export async function gatherAdaptationInput(db: Database, now: Date): Promise<AdaptationInput> {
  const [observations, habitSeries, feedbackRows] = await Promise.all([
    realObservations(db, now),
    realHabitSeries(db),
    listFeedback(db).catch(() => []),
  ]);
  const feedback: FeedbackRecord[] = feedbackRows.map((f) => ({
    proposalId: f.proposalId,
    subject: f.subject,
    type: f.type as FeedbackRecord["type"],
    at: f.at,
  }));
  return { observations, habitSeries, feedback, now };
}
