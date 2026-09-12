/**
 * Education & Career — pure core (no IO, no AI, no randomness; deterministic given its inputs). Expands
 * the recurring weekly timetable onto a date, and derives the upcoming assignments/exams and the
 * advance-dated targets that should surface in Today. The server passes calendar dates already resolved
 * in the owner's timezone (YYYY-MM-DD); this module never touches the wall clock.
 */

export * from "./schemas";

export interface ClassSessionInput {
  id: string;
  courseId: string;
  /** 0 = Sunday … 6 = Saturday. */
  weekday: number;
  startMinute: number;
  endMinute: number;
  kind: string;
  location: string;
}

export interface AssignmentInput {
  id: string;
  title: string;
  courseId: string | null;
  /** ISO instant, or null if undated. */
  dueAt: string | null;
  status: string;
}

export interface ExamInput {
  id: string;
  title: string;
  courseId: string | null;
  examAt: string;
}

export interface TargetInput {
  id: string;
  title: string;
  targetDate: string;
  surfaceFrom: string | null;
  status: string;
}

/** The weekday (0–6) of a YYYY-MM-DD calendar date, timezone-independent. */
export function weekdayOf(dateIso: string): number {
  return new Date(`${dateIso}T00:00:00Z`).getUTCDay();
}

/** Format minutes-from-midnight as HH:MM (24h). */
export function minutesToHHMM(minute: number): string {
  const h = Math.floor(minute / 60);
  const m = minute % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export interface DayClass extends ClassSessionInput {
  start: string;
  end: string;
}

/** The class sessions that fall on `dateIso`, sorted by start time. */
export function classesForDate(sessions: ClassSessionInput[], dateIso: string): DayClass[] {
  const wd = weekdayOf(dateIso);
  return sessions
    .filter((s) => s.weekday === wd)
    .sort((a, b) => a.startMinute - b.startMinute)
    .map((s) => ({ ...s, start: minutesToHHMM(s.startMinute), end: minutesToHHMM(s.endMinute) }));
}

/** The timetable grouped by weekday (0–6), each day's classes sorted by start time. */
export function weekTimetable(sessions: ClassSessionInput[]): DayClass[][] {
  const week: DayClass[][] = [[], [], [], [], [], [], []];
  for (const s of [...sessions].sort((a, b) => a.startMinute - b.startMinute)) {
    if (s.weekday >= 0 && s.weekday <= 6) {
      week[s.weekday]!.push({
        ...s,
        start: minutesToHHMM(s.startMinute),
        end: minutesToHHMM(s.endMinute),
      });
    }
  }
  return week;
}

const OPEN_ASSIGNMENT = new Set(["todo", "in_progress"]);

/** Open assignments due within `withinDays` of `nowIso`, soonest first (overdue included). */
export function upcomingAssignments(
  assignments: AssignmentInput[],
  nowIso: string,
  withinDays = 14,
): AssignmentInput[] {
  const now = new Date(nowIso).getTime();
  const horizon = now + withinDays * 86_400_000;
  return assignments
    .filter((a) => a.dueAt !== null && OPEN_ASSIGNMENT.has(a.status))
    .filter((a) => new Date(a.dueAt as string).getTime() <= horizon)
    .sort((a, b) => new Date(a.dueAt as string).getTime() - new Date(b.dueAt as string).getTime());
}

/** Exams starting within `withinDays` of `nowIso` (future only), soonest first. */
export function upcomingExams(exams: ExamInput[], nowIso: string, withinDays = 21): ExamInput[] {
  const now = new Date(nowIso).getTime();
  const horizon = now + withinDays * 86_400_000;
  return exams
    .filter((e) => {
      const t = new Date(e.examAt).getTime();
      return t >= now && t <= horizon;
    })
    .sort((a, b) => new Date(a.examAt).getTime() - new Date(b.examAt).getTime());
}

const LIVE_TARGET = new Set(["planned", "active"]);

/**
 * Advance-dated targets that should surface in Today on `todayIso`: still live (planned/active), the
 * surfacing window has opened (today ≥ surfaceFrom, defaulting to the target date), and the target date
 * has not passed. Sorted by target date (soonest first).
 */
export function surfacingTargets(targets: TargetInput[], todayIso: string): TargetInput[] {
  return targets
    .filter((t) => LIVE_TARGET.has(t.status))
    .filter((t) => {
      const from = t.surfaceFrom ?? t.targetDate;
      return todayIso >= from && todayIso <= t.targetDate;
    })
    .sort((a, b) => (a.targetDate < b.targetDate ? -1 : a.targetDate > b.targetDate ? 1 : 0));
}

/** Days remaining until a target's date from `todayIso` (negative if past). */
export function daysUntil(targetDate: string, todayIso: string): number {
  const a = new Date(`${todayIso}T00:00:00Z`).getTime();
  const b = new Date(`${targetDate}T00:00:00Z`).getTime();
  return Math.round((b - a) / 86_400_000);
}
