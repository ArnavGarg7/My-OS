/**
 * Education & Career schema. College (courses, a recurring weekly timetable, assignments, exams),
 * Internship (a work log), and advance-dated targets (a goal anchored to a future date that surfaces in
 * Today). Free-text bodies use the `encryptedText` column (Stage C — encrypted at rest, no migration).
 * Single user (05 §0: no user_id). Progress/derived views are computed in @myos/core/education.
 *
 * NOTE: the course table is `collegeCourses` (SQL `college_courses`) — `courses` is already the learning
 * courses table in knowledge.ts, so the college course is deliberately namespaced to avoid a clash.
 */
import { relations } from "drizzle-orm";
import {
  boolean,
  date,
  doublePrecision,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { encryptedText } from "../crypto";

export const classKind = pgEnum("class_kind", ["lecture", "lab", "tutorial", "seminar", "other"]);

export const assignmentStatus = pgEnum("assignment_status", [
  "todo",
  "in_progress",
  "submitted",
  "graded",
]);

export const internshipEntryKind = pgEnum("internship_entry_kind", [
  "work",
  "meeting",
  "learning",
  "deliverable",
]);

export const targetStatus = pgEnum("target_status", [
  "planned",
  "active",
  "hit",
  "missed",
  "archived",
]);

/** A college course the owner is taking. */
export const collegeCourses = pgTable("college_courses", {
  id: uuid("id").defaultRandom().primaryKey(),
  code: text("code").notNull().default(""),
  title: text("title").notNull(),
  instructor: text("instructor").notNull().default(""),
  location: text("location").notNull().default(""),
  /** Accent color token/hex for the timetable + calendar. */
  color: text("color").notNull().default(""),
  /** Free-text term label, e.g. "Autumn 2026". */
  term: text("term").notNull().default(""),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/** One recurring weekly class block (the timetable). Times are minutes-from-midnight in the owner's tz. */
export const classSessions = pgTable("class_sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  courseId: uuid("course_id")
    .notNull()
    .references(() => collegeCourses.id, { onDelete: "cascade" }),
  /** 0 = Sunday … 6 = Saturday (matches JS Date.getDay()). */
  weekday: integer("weekday").notNull(),
  /** Minutes from midnight, e.g. 09:30 = 570. */
  startMinute: integer("start_minute").notNull(),
  endMinute: integer("end_minute").notNull(),
  kind: classKind("kind").notNull().default("lecture"),
  location: text("location").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/** A piece of coursework with a due date. */
export const assignments = pgTable("assignments", {
  id: uuid("id").defaultRandom().primaryKey(),
  courseId: uuid("course_id").references(() => collegeCourses.id, { onDelete: "set null" }),
  title: text("title").notNull(),
  details: encryptedText("details").notNull().default(""),
  dueAt: timestamp("due_at", { withTimezone: true }),
  status: assignmentStatus("status").notNull().default("todo"),
  /** Free-text grade once returned, e.g. "A" or "86%". */
  grade: text("grade").notNull().default(""),
  /** Weight toward the course, 0–1 (nullable = unknown). */
  weight: doublePrecision("weight"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/** A scheduled exam. */
export const exams = pgTable("exams", {
  id: uuid("id").defaultRandom().primaryKey(),
  courseId: uuid("course_id").references(() => collegeCourses.id, { onDelete: "set null" }),
  title: text("title").notNull(),
  examAt: timestamp("exam_at", { withTimezone: true }).notNull(),
  endAt: timestamp("end_at", { withTimezone: true }),
  location: text("location").notNull().default(""),
  notes: encryptedText("notes").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/** One internship log entry — work done, a meeting, a learning, or a deliverable. */
export const internshipEntries = pgTable("internship_entries", {
  id: uuid("id").defaultRandom().primaryKey(),
  entryDate: date("entry_date", { mode: "string" }).notNull(),
  title: text("title").notNull(),
  kind: internshipEntryKind("kind").notNull().default("work"),
  /** Hours logged for the entry (attendance/effort). */
  hours: doublePrecision("hours").notNull().default(0),
  notes: encryptedText("notes").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/** An advance-dated target: a goal anchored to a future date that surfaces in Today as it approaches. */
export const targets = pgTable("targets", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: text("title").notNull(),
  details: text("details").notNull().default(""),
  /** The date the target is for. */
  targetDate: date("target_date", { mode: "string" }).notNull(),
  /** Start surfacing in Today from this date (null = surface only on the target date). */
  surfaceFrom: date("surface_from", { mode: "string" }),
  /** Free-text bucket, e.g. "education" | "career" | "personal". */
  category: text("category").notNull().default("personal"),
  status: targetStatus("status").notNull().default("planned"),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const collegeCoursesRelations = relations(collegeCourses, ({ many }) => ({
  sessions: many(classSessions),
  assignments: many(assignments),
  exams: many(exams),
}));

export const classSessionsRelations = relations(classSessions, ({ one }) => ({
  course: one(collegeCourses, {
    fields: [classSessions.courseId],
    references: [collegeCourses.id],
  }),
}));

export const assignmentsRelations = relations(assignments, ({ one }) => ({
  course: one(collegeCourses, {
    fields: [assignments.courseId],
    references: [collegeCourses.id],
  }),
}));

export const examsRelations = relations(exams, ({ one }) => ({
  course: one(collegeCourses, { fields: [exams.courseId], references: [collegeCourses.id] }),
}));

export type CollegeCourseRow = typeof collegeCourses.$inferSelect;
export type CollegeCourseInsert = typeof collegeCourses.$inferInsert;
export type ClassSessionRow = typeof classSessions.$inferSelect;
export type ClassSessionInsert = typeof classSessions.$inferInsert;
export type AssignmentRow = typeof assignments.$inferSelect;
export type AssignmentInsert = typeof assignments.$inferInsert;
export type ExamRow = typeof exams.$inferSelect;
export type ExamInsert = typeof exams.$inferInsert;
export type InternshipEntryRow = typeof internshipEntries.$inferSelect;
export type InternshipEntryInsert = typeof internshipEntries.$inferInsert;
export type TargetRow = typeof targets.$inferSelect;
export type TargetInsert = typeof targets.$inferInsert;
