import type { Routine, RoutineCompletion } from "./types";

/**
 * Routine adherence (Sprint 4.2). Pure derivations — how consistently routines are run.
 */
function ymd(d: Date): string {
  return d.toISOString().slice(0, 10);
}
function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setUTCDate(x.getUTCDate() + n);
  return x;
}

/** Adherence for one routine over a window: percent of days it was completed. */
export function routineAdherence(
  routineId: string,
  completions: RoutineCompletion[],
  now: Date,
  windowDays = 30,
): number {
  const start = addDays(now, -(windowDays - 1));
  const days = new Set<string>();
  for (const c of completions) {
    if (c.routineId !== routineId) continue;
    if (new Date(`${c.date}T00:00:00Z`).getTime() >= new Date(ymd(start)).getTime()) {
      days.add(c.date);
    }
  }
  return Math.round((days.size / windowDays) * 100);
}

/** Average adherence across active routines. */
export function averageAdherence(
  routines: Routine[],
  completions: RoutineCompletion[],
  now: Date,
): number {
  const active = routines.filter((r) => r.status === "active");
  if (active.length === 0) return 0;
  const total = active.reduce((n, r) => n + routineAdherence(r.id, completions, now), 0);
  return Math.round(total / active.length);
}

/** Completion quality: average fraction of steps completed across recorded runs. */
export function completionQuality(completions: RoutineCompletion[]): number {
  if (completions.length === 0) return 0;
  const total = completions.reduce(
    (n, c) => n + (c.totalSteps > 0 ? c.completedSteps / c.totalSteps : 0),
    0,
  );
  return Math.round((total / completions.length) * 100);
}
