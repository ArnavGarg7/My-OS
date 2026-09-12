import "server-only";
import type { Database } from "@myos/db";
import type { AssignmentRow, ClassSessionRow, ExamRow, TargetRow } from "@myos/db/schema";
import {
  classesForDate,
  surfacingTargets,
  upcomingAssignments,
  upcomingExams,
  weekTimetable,
  type AssignmentInput,
  type ClassSessionInput,
  type CreateAssignmentInput,
  type CreateCourseInput,
  type CreateExamInput,
  type CreateInternshipEntryInput,
  type CreateSessionInput,
  type CreateTargetInput,
  type ExamInput,
  type TargetInput,
  type UpdateAssignmentInput,
  type UpdateCourseInput,
  type UpdateExamInput,
  type UpdateInternshipEntryInput,
  type UpdateSessionInput,
  type UpdateTargetInput,
} from "@myos/core/education";
import * as repo from "./repository";

/**
 * EducationService (Part B). Bridges the pure @myos/core/education engine with persistence, and builds
 * the derived day/week view (timetable expanded onto a date + upcoming deadlines + surfacing targets)
 * that the College page and Today both read. ISO instants from the API become Date for the timestamp
 * columns here.
 */

const toSessionInput = (r: ClassSessionRow): ClassSessionInput => ({
  id: r.id,
  courseId: r.courseId,
  weekday: r.weekday,
  startMinute: r.startMinute,
  endMinute: r.endMinute,
  kind: r.kind,
  location: r.location,
});
const toAssignmentInput = (r: AssignmentRow): AssignmentInput => ({
  id: r.id,
  title: r.title,
  courseId: r.courseId,
  dueAt: r.dueAt ? r.dueAt.toISOString() : null,
  status: r.status,
});
const toExamInput = (r: ExamRow): ExamInput => ({
  id: r.id,
  title: r.title,
  courseId: r.courseId,
  examAt: r.examAt.toISOString(),
});
const toTargetInput = (r: TargetRow): TargetInput => ({
  id: r.id,
  title: r.title,
  targetDate: r.targetDate,
  surfaceFrom: r.surfaceFrom,
  status: r.status,
});

/** Drop undefined-valued keys so a partial patch satisfies exactOptionalPropertyTypes on `.set()`. */
function compact<T extends Record<string, unknown>>(
  o: T,
): { [K in keyof T]?: Exclude<T[K], undefined> } {
  return Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined)) as {
    [K in keyof T]?: Exclude<T[K], undefined>;
  };
}

// ── Reads ────────────────────────────────────────────────────────────────────
export async function list(db: Database) {
  const [courses, sessions, assignments, exams, internship, targets] = await Promise.all([
    repo.listCourses(db),
    repo.listSessions(db),
    repo.listAssignments(db),
    repo.listExams(db),
    repo.listInternshipEntries(db),
    repo.listTargets(db),
  ]);
  return { courses, sessions, assignments, exams, internship, targets };
}

/**
 * The derived College/Today view for an owner-local `date` (YYYY-MM-DD): the timetable expanded onto
 * the date and the whole week, plus the upcoming assignments/exams and the targets surfacing today. The
 * upcoming lists come back as full rows in the engine's order.
 */
export async function overview(db: Database, date: string) {
  const nowIso = new Date().toISOString();
  const [courses, sessionRows, assignmentRows, examRows, targetRows] = await Promise.all([
    repo.listCourses(db),
    repo.listSessions(db),
    repo.listAssignments(db),
    repo.listExams(db),
    repo.listTargets(db),
  ]);

  const sessions = sessionRows.map(toSessionInput);
  const courseById = new Map(courses.map((c) => [c.id, c]));
  const enrich = (c: ReturnType<typeof classesForDate>[number]) => ({
    ...c,
    course: courseById.get(c.courseId) ?? null,
  });

  const aById = new Map(assignmentRows.map((r) => [r.id, r]));
  const eById = new Map(examRows.map((r) => [r.id, r]));
  const tById = new Map(targetRows.map((r) => [r.id, r]));

  return {
    date,
    courses,
    classesToday: classesForDate(sessions, date).map(enrich),
    week: weekTimetable(sessions).map((day) => day.map(enrich)),
    upcomingAssignments: upcomingAssignments(assignmentRows.map(toAssignmentInput), nowIso)
      .map((a) => aById.get(a.id))
      .filter((r): r is AssignmentRow => r !== undefined),
    upcomingExams: upcomingExams(examRows.map(toExamInput), nowIso)
      .map((e) => eById.get(e.id))
      .filter((r): r is ExamRow => r !== undefined),
    surfacingTargets: surfacingTargets(targetRows.map(toTargetInput), date)
      .map((t) => tById.get(t.id))
      .filter((r): r is TargetRow => r !== undefined),
  };
}

/** The compact set Today needs for `date`: class blocks, due-soon assignments/exams, surfacing targets. */
export async function todayItems(db: Database, date: string) {
  const o = await overview(db, date);
  return {
    classes: o.classesToday,
    assignments: o.upcomingAssignments.slice(0, 5),
    exams: o.upcomingExams.slice(0, 3),
    targets: o.surfacingTargets,
  };
}

// ── Courses ────────────────────────────────────────────────────────────────────
export function createCourse(db: Database, input: CreateCourseInput) {
  return repo.insertCourse(db, { ...input });
}
export function updateCourse(db: Database, input: UpdateCourseInput) {
  const { id, ...patch } = input;
  return repo.updateCourse(db, id, compact(patch));
}
export async function deleteCourse(db: Database, id: string) {
  await repo.deleteCourse(db, id);
  return { ok: true as const };
}

// ── Class sessions ───────────────────────────────────────────────────────────────
export function createSession(db: Database, input: CreateSessionInput) {
  return repo.insertSession(db, { ...input });
}
export function updateSession(db: Database, input: UpdateSessionInput) {
  const { id, ...patch } = input;
  return repo.updateSession(db, id, compact(patch));
}
export async function deleteSession(db: Database, id: string) {
  await repo.deleteSession(db, id);
  return { ok: true as const };
}

// ── Assignments ──────────────────────────────────────────────────────────────────
export function createAssignment(db: Database, input: CreateAssignmentInput) {
  const { dueAt, ...rest } = input;
  return repo.insertAssignment(db, { ...rest, dueAt: dueAt ? new Date(dueAt) : null });
}
export function updateAssignment(db: Database, input: UpdateAssignmentInput) {
  const { id, dueAt, ...rest } = input;
  return repo.updateAssignment(
    db,
    id,
    compact({ ...rest, ...(dueAt !== undefined ? { dueAt: dueAt ? new Date(dueAt) : null } : {}) }),
  );
}
export async function deleteAssignment(db: Database, id: string) {
  await repo.deleteAssignment(db, id);
  return { ok: true as const };
}

// ── Exams ────────────────────────────────────────────────────────────────────────
export function createExam(db: Database, input: CreateExamInput) {
  const { examAt, endAt, ...rest } = input;
  return repo.insertExam(db, {
    ...rest,
    examAt: new Date(examAt),
    endAt: endAt ? new Date(endAt) : null,
  });
}
export function updateExam(db: Database, input: UpdateExamInput) {
  const { id, examAt, endAt, ...rest } = input;
  return repo.updateExam(
    db,
    id,
    compact({
      ...rest,
      ...(examAt !== undefined ? { examAt: new Date(examAt) } : {}),
      ...(endAt !== undefined ? { endAt: endAt ? new Date(endAt) : null } : {}),
    }),
  );
}
export async function deleteExam(db: Database, id: string) {
  await repo.deleteExam(db, id);
  return { ok: true as const };
}

// ── Internship log ─────────────────────────────────────────────────────────────────
export function createInternshipEntry(db: Database, input: CreateInternshipEntryInput) {
  return repo.insertInternshipEntry(db, { ...input });
}
export function updateInternshipEntry(db: Database, input: UpdateInternshipEntryInput) {
  const { id, ...patch } = input;
  return repo.updateInternshipEntry(db, id, compact(patch));
}
export async function deleteInternshipEntry(db: Database, id: string) {
  await repo.deleteInternshipEntry(db, id);
  return { ok: true as const };
}

// ── Targets ──────────────────────────────────────────────────────────────────────
export function createTarget(db: Database, input: CreateTargetInput) {
  return repo.insertTarget(db, { ...input });
}
export function updateTarget(db: Database, input: UpdateTargetInput) {
  const { id, status, ...rest } = input;
  // Stamp completion when a target is marked hit (and clear it otherwise).
  const completion =
    status === undefined ? {} : { completedAt: status === "hit" ? new Date() : null };
  return repo.updateTarget(
    db,
    id,
    compact({ ...rest, ...(status ? { status } : {}), ...completion }),
  );
}
export async function deleteTarget(db: Database, id: string) {
  await repo.deleteTarget(db, id);
  return { ok: true as const };
}
