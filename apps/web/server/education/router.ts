import {
  createAssignmentSchema,
  createCourseSchema,
  createExamSchema,
  createInternshipEntrySchema,
  createSessionSchema,
  createTargetSchema,
  dayViewSchema,
  idSchema,
  updateAssignmentSchema,
  updateCourseSchema,
  updateExamSchema,
  updateInternshipEntrySchema,
  updateSessionSchema,
  updateTargetSchema,
} from "@myos/core/education";
import { protectedProcedure, router } from "../trpc";
import * as service from "./service";

/**
 * Education & Career API (Part B). Thin, zod-validated tRPC surface over EducationService — college
 * courses + timetable, assignments, exams, the internship log, and advance-dated targets, plus the
 * derived day/week `overview` the College page and Today read.
 */
export const educationRouter = router({
  list: protectedProcedure.query(({ ctx }) => service.list(ctx.db)),
  overview: protectedProcedure
    .input(dayViewSchema)
    .query(({ ctx, input }) => service.overview(ctx.db, input.date)),
  today: protectedProcedure
    .input(dayViewSchema)
    .query(({ ctx, input }) => service.todayItems(ctx.db, input.date)),

  // Courses
  createCourse: protectedProcedure
    .input(createCourseSchema)
    .mutation(({ ctx, input }) => service.createCourse(ctx.db, input)),
  updateCourse: protectedProcedure
    .input(updateCourseSchema)
    .mutation(({ ctx, input }) => service.updateCourse(ctx.db, input)),
  deleteCourse: protectedProcedure
    .input(idSchema)
    .mutation(({ ctx, input }) => service.deleteCourse(ctx.db, input.id)),

  // Timetable
  createSession: protectedProcedure
    .input(createSessionSchema)
    .mutation(({ ctx, input }) => service.createSession(ctx.db, input)),
  updateSession: protectedProcedure
    .input(updateSessionSchema)
    .mutation(({ ctx, input }) => service.updateSession(ctx.db, input)),
  deleteSession: protectedProcedure
    .input(idSchema)
    .mutation(({ ctx, input }) => service.deleteSession(ctx.db, input.id)),

  // Assignments
  createAssignment: protectedProcedure
    .input(createAssignmentSchema)
    .mutation(({ ctx, input }) => service.createAssignment(ctx.db, input)),
  updateAssignment: protectedProcedure
    .input(updateAssignmentSchema)
    .mutation(({ ctx, input }) => service.updateAssignment(ctx.db, input)),
  deleteAssignment: protectedProcedure
    .input(idSchema)
    .mutation(({ ctx, input }) => service.deleteAssignment(ctx.db, input.id)),

  // Exams
  createExam: protectedProcedure
    .input(createExamSchema)
    .mutation(({ ctx, input }) => service.createExam(ctx.db, input)),
  updateExam: protectedProcedure
    .input(updateExamSchema)
    .mutation(({ ctx, input }) => service.updateExam(ctx.db, input)),
  deleteExam: protectedProcedure
    .input(idSchema)
    .mutation(({ ctx, input }) => service.deleteExam(ctx.db, input.id)),

  // Internship log
  createInternshipEntry: protectedProcedure
    .input(createInternshipEntrySchema)
    .mutation(({ ctx, input }) => service.createInternshipEntry(ctx.db, input)),
  updateInternshipEntry: protectedProcedure
    .input(updateInternshipEntrySchema)
    .mutation(({ ctx, input }) => service.updateInternshipEntry(ctx.db, input)),
  deleteInternshipEntry: protectedProcedure
    .input(idSchema)
    .mutation(({ ctx, input }) => service.deleteInternshipEntry(ctx.db, input.id)),

  // Advance-dated targets
  createTarget: protectedProcedure
    .input(createTargetSchema)
    .mutation(({ ctx, input }) => service.createTarget(ctx.db, input)),
  updateTarget: protectedProcedure
    .input(updateTargetSchema)
    .mutation(({ ctx, input }) => service.updateTarget(ctx.db, input)),
  deleteTarget: protectedProcedure
    .input(idSchema)
    .mutation(({ ctx, input }) => service.deleteTarget(ctx.db, input.id)),
});
