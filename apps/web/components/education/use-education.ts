"use client";

import { trpc } from "@/lib/trpc/client";

/** The owner-local calendar date (YYYY-MM-DD) for "today" — the overview/Today queries key off this. */
export function todayDateIso(now = new Date()): string {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
    now.getDate(),
  ).padStart(2, "0")}`;
}

/**
 * Education data hook — the College + Internship UIs read/write through here so mutations invalidate the
 * overview + list queries consistently. Thin wrapper over the tRPC `education` router.
 */
export function useEducation() {
  const utils = trpc.useUtils();
  const date = todayDateIso();
  const overview = trpc.education.overview.useQuery({ date });
  const list = trpc.education.list.useQuery();

  const invalidate = () => {
    void utils.education.overview.invalidate();
    void utils.education.list.invalidate();
  };
  const opts = { onSuccess: invalidate };

  return {
    date,
    overview,
    list,
    createCourse: trpc.education.createCourse.useMutation(opts),
    updateCourse: trpc.education.updateCourse.useMutation(opts),
    deleteCourse: trpc.education.deleteCourse.useMutation(opts),
    createSession: trpc.education.createSession.useMutation(opts),
    deleteSession: trpc.education.deleteSession.useMutation(opts),
    createAssignment: trpc.education.createAssignment.useMutation(opts),
    updateAssignment: trpc.education.updateAssignment.useMutation(opts),
    deleteAssignment: trpc.education.deleteAssignment.useMutation(opts),
    createExam: trpc.education.createExam.useMutation(opts),
    deleteExam: trpc.education.deleteExam.useMutation(opts),
    createTarget: trpc.education.createTarget.useMutation(opts),
    updateTarget: trpc.education.updateTarget.useMutation(opts),
    deleteTarget: trpc.education.deleteTarget.useMutation(opts),
    createInternshipEntry: trpc.education.createInternshipEntry.useMutation(opts),
    deleteInternshipEntry: trpc.education.deleteInternshipEntry.useMutation(opts),
  };
}
