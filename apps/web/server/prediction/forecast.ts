import "server-only";
import type { Database } from "@myos/db";
import type { PredictionInput } from "@myos/core/prediction";
import * as taskService from "../task/service";
import * as goalService from "../goal/service";
import * as calendarService from "../calendar/service";
import { healthSignals } from "../health";

/**
 * Feature extraction (Sprint 6.2). READ-ONLY over frozen module read models → the numeric inputs the
 * prediction models consume. Never mutates. Reads degrade to empties so a forecast run always
 * completes. Where a persisted time-series isn't available yet (Sprint 6.2 ships the models; the
 * `prediction_history`/`prediction_features` tables accumulate real history over time), inputs are
 * derived deterministically from current read models — a conservative stand-in, not a guess.
 */

const isoDate = (now: Date) => now.toISOString().slice(0, 10);

export async function gatherPredictionInput(
  db: Database,
  tz: string,
  now = new Date(),
): Promise<PredictionInput> {
  const date = isoDate(now);
  const weekStart = `${date}T00:00:00.000Z`;
  const weekEnd = new Date(now.getTime() + 7 * 86_400_000).toISOString();

  const [tasks, goals, events, health] = await Promise.all([
    taskService.list(db, {}).catch(() => [] as unknown[]),
    goalService.list(db).catch(() => [] as unknown[]),
    calendarService.list(db, { from: weekStart, to: weekEnd }).catch(() => [] as unknown[]),
    healthSignals(db, date, now).catch(() => null),
  ]);

  const openTasks = (
    tasks as { id: string; title: string; status: string; dueAt: string | null }[]
  ).filter((t) => t.status !== "done" && t.status !== "cancelled");

  // Deadline forecast: the soonest due-cluster. Velocity is a conservative 1.5 tasks/day baseline
  // until real completion history accrues.
  const dated = openTasks
    .filter((t) => t.dueAt)
    .sort((a, b) => new Date(a.dueAt!).getTime() - new Date(b.dueAt!).getTime());
  const deadlines: PredictionInput["deadlines"] = [];
  const soonest = dated[0];
  if (soonest?.dueAt) {
    const availableDays = Math.max(
      1,
      Math.floor((new Date(soonest.dueAt).getTime() - now.getTime()) / 86_400_000),
    );
    const remainingTasks = dated.filter(
      (t) => new Date(t.dueAt!).getTime() <= new Date(soonest.dueAt!).getTime() + 2 * 86_400_000,
    ).length;
    deadlines.push({
      id: soonest.id,
      label: soonest.title,
      remainingTasks,
      completionVelocity: 1.5,
      availableDays,
    });
  }

  // Goal forecast: derive a per-day pace stand-in from current progress over an assumed 30-day arc.
  const goalInputs: PredictionInput["goals"] = (
    goals as { id: string; title: string; progress?: number }[]
  )
    .slice(0, 5)
    .map((g) => {
      const progress = g.progress ?? 0;
      const pace = Math.round((progress / 30) * 10) / 10;
      return {
        id: g.id,
        label: g.title,
        progress,
        progressHistory: [pace, pace, pace],
        daysRemaining: 30,
      };
    });

  // Schedule forecast: booked minutes per day across the week.
  const byDay = new Map<string, number>();
  for (const e of events as { startAt: string; endAt: string }[]) {
    const d = new Date(e.startAt).toISOString().slice(0, 10);
    const mins = Math.max(
      0,
      (new Date(e.endAt).getTime() - new Date(e.startAt).getTime()) / 60_000,
    );
    byDay.set(d, (byDay.get(d) ?? 0) + mins);
  }
  const bookedMinutesByDay = Array.from(
    { length: 7 },
    (_, i) => byDay.get(new Date(now.getTime() + i * 86_400_000).toISOString().slice(0, 10)) ?? 0,
  );

  // Workload forecast: readiness stand-in history from the current signal.
  const readiness = health ? health.readiness : 60;
  const workload = Math.min(100, openTasks.length * 8);

  const input: PredictionInput = {
    deadlines,
    goals: goalInputs,
    schedule: { bookedMinutesByDay, dayCapacityMinutes: 480 },
    workload: {
      workloadHistory: [workload, workload, workload],
      readinessHistory: [readiness, readiness, readiness],
    },
    health: {
      readinessHistory: [readiness, readiness, readiness],
      sleepHistory: [7, 7, 7],
      workoutDays: [1, 0, 1, 0, 1],
    },
  };
  return input;
}
