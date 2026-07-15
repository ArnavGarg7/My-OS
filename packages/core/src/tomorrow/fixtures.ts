import type {
  CalendarMergeEvent,
  CarryForwardCandidate,
  DayReviewInput,
  PriorityCandidate,
  ReadinessInput,
  TomorrowContext,
} from "./types";

/** Test fixtures for the tomorrow engine (imported by *.test.ts). */
export const at = (y: number, mo: number, d: number, h = 12, mi = 0) =>
  new Date(Date.UTC(y, mo, d, h, mi, 0)).toISOString();
export const day = (y: number, mo: number, d: number) =>
  new Date(Date.UTC(y, mo, d)).toISOString().slice(0, 10);

export function makeReviewInput(over: Partial<DayReviewInput> = {}): DayReviewInput {
  return {
    tasksCompleted: over.tasksCompleted ?? 6,
    tasksCreated: over.tasksCreated ?? 2,
    plannerAccuracy: over.plannerAccuracy ?? 80,
    decisionsAccepted: over.decisionsAccepted ?? 2,
    deepWorkMinutes: over.deepWorkMinutes ?? 150,
    calendarCompletion: over.calendarCompletion ?? 100,
    goalProgress: over.goalProgress ?? 65,
    healthReadiness: over.healthReadiness ?? 78,
    journalCompleted: over.journalCompleted ?? true,
  };
}

export function makeCarryForward(): CarryForwardCandidate[] {
  return [
    {
      id: "cf1",
      kind: "task",
      title: "Finish report",
      reason: "Overdue",
      entityId: "t1",
      priority: "high",
    },
    {
      id: "cf2",
      kind: "task",
      title: "Email client",
      reason: "Not started",
      entityId: "t2",
      priority: "medium",
    },
    { id: "cf3", kind: "milestone", title: "Alpha release", reason: "Incomplete", entityId: "m1" },
    { id: "cf4", kind: "decision", title: "Pick vendor", reason: "Active", entityId: "d1" },
    { id: "cf5", kind: "inbox", title: "Read spec", reason: "Unprocessed", entityId: "i1" },
  ];
}

export function makePriorities(): PriorityCandidate[] {
  return [
    {
      id: "p1",
      kind: "task",
      title: "Ship v2",
      entityId: "t1",
      taskPriority: 3,
      projectUrgency: 2,
    },
    { id: "p2", kind: "goal", title: "Study 2h", entityId: "g1", goalDeadline: 2, taskPriority: 1 },
    {
      id: "p3",
      kind: "project",
      title: "Campus AI",
      entityId: "pr1",
      projectUrgency: 3,
      plannerOverflow: 1,
    },
    { id: "p4", kind: "decision", title: "Review at-risk", entityId: "d1", decisionImportance: 2 },
    { id: "p5", kind: "task", title: "Refactor auth", entityId: "t9", taskPriority: 1 },
  ];
}

export function makeCalendar(): CalendarMergeEvent[] {
  return [
    {
      id: "e1",
      title: "Standup",
      start: at(2026, 6, 8, 9),
      end: at(2026, 6, 8, 9, 30),
      kind: "meeting",
    },
    {
      id: "e2",
      title: "Lecture",
      start: at(2026, 6, 8, 11),
      end: at(2026, 6, 8, 12, 30),
      kind: "class",
    },
    {
      id: "e3",
      title: "1:1",
      start: at(2026, 6, 8, 15),
      end: at(2026, 6, 8, 15, 30),
      kind: "meeting",
    },
  ];
}

export function makeReadinessInput(over: Partial<ReadinessInput> = {}): ReadinessInput {
  return {
    sleepTargetMinutes: over.sleepTargetMinutes ?? 450,
    expectedWorkloadMinutes: over.expectedWorkloadMinutes ?? 180,
    meetingMinutes: over.meetingMinutes ?? 150,
    healthReadiness: over.healthReadiness ?? 78,
  };
}

export function makeContext(over: Partial<TomorrowContext> = {}): TomorrowContext {
  return {
    now: over.now ?? new Date(at(2026, 6, 7, 20)),
    timezone: over.timezone ?? "Asia/Kolkata",
    planningDate: over.planningDate ?? day(2026, 6, 7),
    targetDate: over.targetDate ?? day(2026, 6, 8),
    review: over.review ?? makeReviewInput(),
    carryForwardCandidates: over.carryForwardCandidates ?? makeCarryForward(),
    priorityCandidates: over.priorityCandidates ?? makePriorities(),
    calendar: over.calendar ?? makeCalendar(),
    readiness: over.readiness ?? makeReadinessInput(),
    ...(over.checklist !== undefined ? { checklist: over.checklist } : {}),
  };
}
