import { describe, expect, it } from "vitest";
import {
  classesForDate,
  daysUntil,
  minutesToHHMM,
  surfacingTargets,
  upcomingAssignments,
  upcomingExams,
  weekdayOf,
  weekTimetable,
  type AssignmentInput,
  type ClassSessionInput,
  type ExamInput,
  type TargetInput,
} from "./index";

const session = (
  o: Partial<ClassSessionInput> & { weekday: number; startMinute: number },
): ClassSessionInput => ({
  id: crypto.randomUUID(),
  courseId: "c1",
  endMinute: o.startMinute + 60,
  kind: "lecture",
  location: "",
  ...o,
});

describe("weekday + time helpers", () => {
  it("computes weekday tz-independently", () => {
    // 2026-09-14 is a Monday.
    expect(weekdayOf("2026-09-14")).toBe(1);
    expect(weekdayOf("2026-09-13")).toBe(0); // Sunday
  });
  it("formats minutes as HH:MM", () => {
    expect(minutesToHHMM(570)).toBe("09:30");
    expect(minutesToHHMM(0)).toBe("00:00");
    expect(minutesToHHMM(1439)).toBe("23:59");
  });
});

describe("classesForDate", () => {
  const sessions = [
    session({ weekday: 1, startMinute: 600 }), // Mon 10:00
    session({ weekday: 1, startMinute: 540 }), // Mon 09:00
    session({ weekday: 3, startMinute: 480 }), // Wed 08:00
  ];
  it("returns only the date's weekday, sorted by start", () => {
    const mon = classesForDate(sessions, "2026-09-14"); // Monday
    expect(mon.map((c) => c.start)).toEqual(["09:00", "10:00"]);
    expect(classesForDate(sessions, "2026-09-15")).toHaveLength(0); // Tuesday
  });
  it("groups the whole week by weekday", () => {
    const week = weekTimetable(sessions);
    expect(week).toHaveLength(7);
    expect(week[1]).toHaveLength(2);
    expect(week[3]).toHaveLength(1);
    expect(week[0]).toHaveLength(0);
  });
});

describe("upcoming deadlines", () => {
  const now = "2026-09-14T09:00:00Z";
  const assignments: AssignmentInput[] = [
    { id: "a1", title: "Essay", courseId: "c1", dueAt: "2026-09-16T23:59:00Z", status: "todo" },
    { id: "a2", title: "Done", courseId: "c1", dueAt: "2026-09-15T10:00:00Z", status: "submitted" },
    { id: "a3", title: "Far", courseId: "c1", dueAt: "2026-12-01T10:00:00Z", status: "todo" },
    { id: "a4", title: "Undated", courseId: null, dueAt: null, status: "todo" },
  ];
  it("keeps only open, dated, within-window assignments soonest-first", () => {
    const up = upcomingAssignments(assignments, now, 14);
    expect(up.map((a) => a.id)).toEqual(["a1"]);
  });

  const exams: ExamInput[] = [
    { id: "e1", title: "Midterm", courseId: "c1", examAt: "2026-09-20T09:00:00Z" },
    { id: "e2", title: "Past", courseId: "c1", examAt: "2026-09-10T09:00:00Z" },
  ];
  it("keeps future exams within window", () => {
    expect(upcomingExams(exams, now, 21).map((e) => e.id)).toEqual(["e1"]);
  });
});

describe("surfacingTargets", () => {
  const targets: TargetInput[] = [
    {
      id: "t1",
      title: "Ship",
      targetDate: "2026-09-20",
      surfaceFrom: "2026-09-14",
      status: "active",
    },
    { id: "t2", title: "Later", targetDate: "2026-10-01", surfaceFrom: null, status: "planned" },
    { id: "t3", title: "Done", targetDate: "2026-09-20", surfaceFrom: "2026-09-01", status: "hit" },
    {
      id: "t4",
      title: "Past",
      targetDate: "2026-09-10",
      surfaceFrom: "2026-09-01",
      status: "active",
    },
  ];
  it("surfaces only live targets inside their window", () => {
    // On 2026-09-14: t1 window open; t2 not yet (surfaceFrom defaults to its date); t3 not live; t4 past.
    expect(surfacingTargets(targets, "2026-09-14").map((t) => t.id)).toEqual(["t1"]);
    // On the target date itself, the default-surfacing t2 appears.
    expect(surfacingTargets(targets, "2026-10-01").map((t) => t.id)).toEqual(["t2"]);
  });
  it("computes days until a date", () => {
    expect(daysUntil("2026-09-20", "2026-09-14")).toBe(6);
    expect(daysUntil("2026-09-10", "2026-09-14")).toBe(-4);
  });
});
