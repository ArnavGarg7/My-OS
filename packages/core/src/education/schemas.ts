import { z } from "zod";

/**
 * Education & Career input schemas (pure). The tRPC router validates with these; the service converts
 * ISO instants to Date for the timestamp columns. Kept in core so both the API and any headless caller
 * share one contract.
 */

export const classKindSchema = z.enum(["lecture", "lab", "tutorial", "seminar", "other"]);
export const assignmentStatusSchema = z.enum(["todo", "in_progress", "submitted", "graded"]);
export const internshipEntryKindSchema = z.enum(["work", "meeting", "learning", "deliverable"]);
export const targetStatusSchema = z.enum(["planned", "active", "hit", "missed", "archived"]);

const idString = z.string().uuid();
export const idSchema = z.object({ id: idString });

/** YYYY-MM-DD calendar date. */
const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "expected YYYY-MM-DD");

// ── Courses ───────────────────────────────────────────────────────────────────
export const createCourseSchema = z.object({
  code: z.string().max(40).optional(),
  title: z.string().min(1).max(200),
  instructor: z.string().max(200).optional(),
  location: z.string().max(200).optional(),
  color: z.string().max(40).optional(),
  term: z.string().max(80).optional(),
  active: z.boolean().optional(),
});
export const updateCourseSchema = createCourseSchema.partial().extend({ id: idString });

// ── Class sessions (timetable) ─────────────────────────────────────────────────
export const createSessionSchema = z.object({
  courseId: idString,
  weekday: z.number().int().min(0).max(6),
  startMinute: z.number().int().min(0).max(1439),
  endMinute: z.number().int().min(1).max(1440),
  kind: classKindSchema.optional(),
  location: z.string().max(200).optional(),
});
export const updateSessionSchema = createSessionSchema
  .omit({ courseId: true })
  .partial()
  .extend({ id: idString });

// ── Assignments ────────────────────────────────────────────────────────────────
export const createAssignmentSchema = z.object({
  courseId: idString.nullable().optional(),
  title: z.string().min(1).max(200),
  details: z.string().max(10_000).optional(),
  dueAt: z.string().datetime().nullable().optional(),
  status: assignmentStatusSchema.optional(),
  grade: z.string().max(40).optional(),
  weight: z.number().min(0).max(1).nullable().optional(),
});
export const updateAssignmentSchema = createAssignmentSchema.partial().extend({ id: idString });

// ── Exams ──────────────────────────────────────────────────────────────────────
export const createExamSchema = z.object({
  courseId: idString.nullable().optional(),
  title: z.string().min(1).max(200),
  examAt: z.string().datetime(),
  endAt: z.string().datetime().nullable().optional(),
  location: z.string().max(200).optional(),
  notes: z.string().max(10_000).optional(),
});
export const updateExamSchema = createExamSchema.partial().extend({ id: idString });

// ── Internship log ───────────────────────────────────────────────────────────────
export const createInternshipEntrySchema = z.object({
  entryDate: dateString,
  title: z.string().min(1).max(200),
  kind: internshipEntryKindSchema.optional(),
  hours: z.number().min(0).max(24).optional(),
  notes: z.string().max(10_000).optional(),
});
export const updateInternshipEntrySchema = createInternshipEntrySchema
  .partial()
  .extend({ id: idString });

// ── Advance-dated targets ────────────────────────────────────────────────────────
export const createTargetSchema = z.object({
  title: z.string().min(1).max(200),
  details: z.string().max(10_000).optional(),
  targetDate: dateString,
  surfaceFrom: dateString.nullable().optional(),
  category: z.string().max(40).optional(),
  status: targetStatusSchema.optional(),
});
export const updateTargetSchema = createTargetSchema.partial().extend({ id: idString });

// ── Day/overview query ───────────────────────────────────────────────────────────
export const dayViewSchema = z.object({
  /** The owner-local date to build the view for (YYYY-MM-DD). */
  date: dateString,
});

// ── Timetable import (vision) ────────────────────────────────────────────────────
/** A course the vision model read off an uploaded timetable image. */
export const parsedCourseSchema = z.object({
  title: z.string().min(1).max(200),
  code: z.string().max(40).optional(),
});
/** A class block the vision model read; `courseTitle` links it to a parsed course by title. */
export const parsedSessionSchema = z.object({
  courseTitle: z.string().min(1).max(200),
  weekday: z.number().int().min(0).max(6),
  start: z.string().regex(/^\d{1,2}:\d{2}$/, "expected H:MM"),
  end: z.string().regex(/^\d{1,2}:\d{2}$/, "expected H:MM"),
  kind: classKindSchema.optional(),
  location: z.string().max(200).optional(),
});
/** The structured timetable the model returns — validated before it ever reaches the DB. */
export const parsedTimetableSchema = z.object({
  courses: z.array(parsedCourseSchema).max(40),
  sessions: z.array(parsedSessionSchema).max(300),
});
/** parseTimetableImage input — a base64 image (data stripped of its `data:` prefix) + its mime type. */
export const parseTimetableImageSchema = z.object({
  imageBase64: z.string().min(1).max(12_000_000),
  mimeType: z.enum(["image/png", "image/jpeg", "image/webp"]),
});
/** importTimetable input — the reviewed parsed timetable the user confirmed. */
export const importTimetableSchema = parsedTimetableSchema;

export type ParsedCourse = z.infer<typeof parsedCourseSchema>;
export type ParsedSession = z.infer<typeof parsedSessionSchema>;
export type ParsedTimetable = z.infer<typeof parsedTimetableSchema>;

export type CreateCourseInput = z.infer<typeof createCourseSchema>;
export type UpdateCourseInput = z.infer<typeof updateCourseSchema>;
export type CreateSessionInput = z.infer<typeof createSessionSchema>;
export type UpdateSessionInput = z.infer<typeof updateSessionSchema>;
export type CreateAssignmentInput = z.infer<typeof createAssignmentSchema>;
export type UpdateAssignmentInput = z.infer<typeof updateAssignmentSchema>;
export type CreateExamInput = z.infer<typeof createExamSchema>;
export type UpdateExamInput = z.infer<typeof updateExamSchema>;
export type CreateInternshipEntryInput = z.infer<typeof createInternshipEntrySchema>;
export type UpdateInternshipEntryInput = z.infer<typeof updateInternshipEntrySchema>;
export type CreateTargetInput = z.infer<typeof createTargetSchema>;
export type UpdateTargetInput = z.infer<typeof updateTargetSchema>;
