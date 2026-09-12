import "server-only";
import { asc, desc, eq } from "drizzle-orm";
import type { Database } from "@myos/db";
import {
  assignments,
  classSessions,
  collegeCourses,
  exams,
  internshipEntries,
  targets,
  type AssignmentInsert,
  type AssignmentRow,
  type ClassSessionInsert,
  type ClassSessionRow,
  type CollegeCourseInsert,
  type CollegeCourseRow,
  type ExamInsert,
  type ExamRow,
  type InternshipEntryInsert,
  type InternshipEntryRow,
  type TargetInsert,
  type TargetRow,
} from "@myos/db/schema";

/**
 * Education & Career persistence (Part B). Pure DB access over the six tables — no business logic; the
 * service composes these with the pure @myos/core/education engine. The `details`/`notes` columns are
 * `encryptedText`, so plaintext in/out is sealed and opened transparently by the column type.
 */

// ── Courses ───────────────────────────────────────────────────────────────────
export function listCourses(db: Database): Promise<CollegeCourseRow[]> {
  return db
    .select()
    .from(collegeCourses)
    .orderBy(desc(collegeCourses.active), asc(collegeCourses.title));
}
export async function insertCourse(
  db: Database,
  v: CollegeCourseInsert,
): Promise<CollegeCourseRow> {
  const [row] = await db.insert(collegeCourses).values(v).returning();
  if (!row) throw new Error("Failed to insert course");
  return row;
}
export async function updateCourse(
  db: Database,
  id: string,
  patch: Partial<CollegeCourseRow>,
): Promise<CollegeCourseRow> {
  const [row] = await db
    .update(collegeCourses)
    .set({ ...patch, updatedAt: new Date() })
    .where(eq(collegeCourses.id, id))
    .returning();
  if (!row) throw new Error("Course not found");
  return row;
}
export async function deleteCourse(db: Database, id: string): Promise<void> {
  await db.delete(collegeCourses).where(eq(collegeCourses.id, id));
}

// ── Class sessions (timetable) ──────────────────────────────────────────────────
export function listSessions(db: Database): Promise<ClassSessionRow[]> {
  return db
    .select()
    .from(classSessions)
    .orderBy(asc(classSessions.weekday), asc(classSessions.startMinute));
}
export async function insertSession(db: Database, v: ClassSessionInsert): Promise<ClassSessionRow> {
  const [row] = await db.insert(classSessions).values(v).returning();
  if (!row) throw new Error("Failed to insert class session");
  return row;
}
export async function updateSession(
  db: Database,
  id: string,
  patch: Partial<ClassSessionRow>,
): Promise<ClassSessionRow> {
  const [row] = await db
    .update(classSessions)
    .set(patch)
    .where(eq(classSessions.id, id))
    .returning();
  if (!row) throw new Error("Class session not found");
  return row;
}
export async function deleteSession(db: Database, id: string): Promise<void> {
  await db.delete(classSessions).where(eq(classSessions.id, id));
}

// ── Assignments ─────────────────────────────────────────────────────────────────
export function listAssignments(db: Database): Promise<AssignmentRow[]> {
  return db.select().from(assignments).orderBy(asc(assignments.dueAt));
}
export async function insertAssignment(db: Database, v: AssignmentInsert): Promise<AssignmentRow> {
  const [row] = await db.insert(assignments).values(v).returning();
  if (!row) throw new Error("Failed to insert assignment");
  return row;
}
export async function updateAssignment(
  db: Database,
  id: string,
  patch: Partial<AssignmentRow>,
): Promise<AssignmentRow> {
  const [row] = await db
    .update(assignments)
    .set({ ...patch, updatedAt: new Date() })
    .where(eq(assignments.id, id))
    .returning();
  if (!row) throw new Error("Assignment not found");
  return row;
}
export async function deleteAssignment(db: Database, id: string): Promise<void> {
  await db.delete(assignments).where(eq(assignments.id, id));
}

// ── Exams ──────────────────────────────────────────────────────────────────────
export function listExams(db: Database): Promise<ExamRow[]> {
  return db.select().from(exams).orderBy(asc(exams.examAt));
}
export async function insertExam(db: Database, v: ExamInsert): Promise<ExamRow> {
  const [row] = await db.insert(exams).values(v).returning();
  if (!row) throw new Error("Failed to insert exam");
  return row;
}
export async function updateExam(
  db: Database,
  id: string,
  patch: Partial<ExamRow>,
): Promise<ExamRow> {
  const [row] = await db
    .update(exams)
    .set({ ...patch, updatedAt: new Date() })
    .where(eq(exams.id, id))
    .returning();
  if (!row) throw new Error("Exam not found");
  return row;
}
export async function deleteExam(db: Database, id: string): Promise<void> {
  await db.delete(exams).where(eq(exams.id, id));
}

// ── Internship log ───────────────────────────────────────────────────────────────
export function listInternshipEntries(db: Database): Promise<InternshipEntryRow[]> {
  return db.select().from(internshipEntries).orderBy(desc(internshipEntries.entryDate));
}
export async function insertInternshipEntry(
  db: Database,
  v: InternshipEntryInsert,
): Promise<InternshipEntryRow> {
  const [row] = await db.insert(internshipEntries).values(v).returning();
  if (!row) throw new Error("Failed to insert internship entry");
  return row;
}
export async function updateInternshipEntry(
  db: Database,
  id: string,
  patch: Partial<InternshipEntryRow>,
): Promise<InternshipEntryRow> {
  const [row] = await db
    .update(internshipEntries)
    .set({ ...patch, updatedAt: new Date() })
    .where(eq(internshipEntries.id, id))
    .returning();
  if (!row) throw new Error("Internship entry not found");
  return row;
}
export async function deleteInternshipEntry(db: Database, id: string): Promise<void> {
  await db.delete(internshipEntries).where(eq(internshipEntries.id, id));
}

// ── Targets ──────────────────────────────────────────────────────────────────────
export function listTargets(db: Database): Promise<TargetRow[]> {
  return db.select().from(targets).orderBy(asc(targets.targetDate));
}
export async function insertTarget(db: Database, v: TargetInsert): Promise<TargetRow> {
  const [row] = await db.insert(targets).values(v).returning();
  if (!row) throw new Error("Failed to insert target");
  return row;
}
export async function updateTarget(
  db: Database,
  id: string,
  patch: Partial<TargetRow>,
): Promise<TargetRow> {
  const [row] = await db
    .update(targets)
    .set({ ...patch, updatedAt: new Date() })
    .where(eq(targets.id, id))
    .returning();
  if (!row) throw new Error("Target not found");
  return row;
}
export async function deleteTarget(db: Database, id: string): Promise<void> {
  await db.delete(targets).where(eq(targets.id, id));
}
