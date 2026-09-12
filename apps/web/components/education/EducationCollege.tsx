"use client";

import { useState, type ReactNode } from "react";
import { CalendarClock, GraduationCap, Plus, Target, Trash2, X } from "lucide-react";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Field,
  Input,
  MonoLabel,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Text,
} from "@myos/ui";
import { PageContainer, PageContent } from "@/components/framework";
import { useEducation } from "./use-education";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0]; // Mon-first
const KINDS = ["lecture", "lab", "tutorial", "seminar", "other"] as const;
const COLORS = ["#e0663f", "#3f93b8", "#1f8f5f", "#8a6fd6", "#d99a2b", "#c0507a"];
const ASSIGNMENT_STATUS = ["todo", "in_progress", "submitted", "graded"] as const;

function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}
function fmtDate(iso: string | Date | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString([], { month: "short", day: "numeric" });
}
function fmtDateTime(iso: string | Date): string {
  return new Date(iso).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function Section({
  icon: Icon,
  title,
  action,
  children,
}: {
  icon: typeof GraduationCap;
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Icon size={16} aria-hidden className="text-accent" />
          <Text variant="heading-s">{title}</Text>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function EducationCollege() {
  const edu = useEducation();
  const data = edu.list.data;
  const week = edu.overview.data?.week;
  const courses = data?.courses ?? [];
  const courseById = new Map(courses.map((c) => [c.id, c]));

  return (
    <PageContainer width="content">
      <PageContent className="space-y-8 py-2">
        <header className="space-y-1">
          <MonoLabel tone="subtle">College</MonoLabel>
          <Text asChild variant="heading-l" className="tracking-tight">
            <h1>Courses, timetable &amp; deadlines</h1>
          </Text>
        </header>

        <TimetableSection week={week} onDeleteSession={(id) => edu.deleteSession.mutate({ id })} />

        <CoursesSection edu={edu} courses={courses} />

        <SessionAdder edu={edu} courses={courses} />

        <AssignmentsSection edu={edu} courses={courses} courseById={courseById} />

        <ExamsSection edu={edu} courses={courses} courseById={courseById} />

        <TargetsSection edu={edu} />
      </PageContent>
    </PageContainer>
  );
}

/* ── Timetable ─────────────────────────────────────────────────────────────── */
function TimetableSection({
  week,
  onDeleteSession,
}: {
  week: NonNullable<ReturnType<typeof useEducation>["overview"]["data"]>["week"] | undefined;
  onDeleteSession: (id: string) => void;
}) {
  const empty = !week || week.every((d) => d.length === 0);
  return (
    <Section icon={CalendarClock} title="Weekly timetable">
      {empty ? (
        <Card variant="section" padding="lg">
          <EmptyState
            title="No classes yet"
            description="Add courses below, then add class times to build your weekly timetable."
          />
        </Card>
      ) : (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
          {WEEK_ORDER.map((wd) => (
            <div key={wd} className="space-y-1.5">
              <MonoLabel tone="subtle">{WEEKDAYS[wd]}</MonoLabel>
              <div className="space-y-1.5">
                {(week?.[wd] ?? []).length === 0 ? (
                  <div className="border-border/60 text-fg-subtle text-caption rounded-md border border-dashed px-2 py-3 text-center">
                    —
                  </div>
                ) : (
                  week?.[wd]?.map((c) => (
                    <div
                      key={c.id}
                      className="border-border bg-surface group relative rounded-md border p-2"
                      style={c.course?.color ? { borderLeft: `3px solid ${c.course.color}` } : {}}
                    >
                      <Text variant="body-s" className="pr-4 font-medium">
                        {c.course?.title ?? "Class"}
                      </Text>
                      <Text variant="caption" tone="subtle">
                        {c.start}–{c.end}
                      </Text>
                      {c.location ? (
                        <Text variant="caption" tone="subtle">
                          {c.location}
                        </Text>
                      ) : null}
                      <button
                        type="button"
                        aria-label="Remove class"
                        onClick={() => onDeleteSession(c.id)}
                        className="text-fg-subtle hover:text-danger absolute right-1 top-1 opacity-0 transition-opacity group-hover:opacity-100"
                      >
                        <X size={12} aria-hidden />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </Section>
  );
}

/* ── Courses ───────────────────────────────────────────────────────────────── */
function CoursesSection({
  edu,
  courses,
}: {
  edu: ReturnType<typeof useEducation>;
  courses: NonNullable<ReturnType<typeof useEducation>["list"]["data"]>["courses"];
}) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [code, setCode] = useState("");
  const [color, setColor] = useState(COLORS[0]);

  const submit = () => {
    if (!title.trim()) return;
    edu.createCourse.mutate(
      { title: title.trim(), code: code.trim(), color },
      {
        onSuccess: () => {
          setTitle("");
          setCode("");
          setOpen(false);
        },
      },
    );
  };

  return (
    <Section
      icon={GraduationCap}
      title="Courses"
      action={
        <Button
          size="sm"
          variant="secondary"
          leftIcon={<Plus size={14} />}
          onClick={() => setOpen((v) => !v)}
        >
          Add course
        </Button>
      }
    >
      {open ? (
        <Card variant="section" padding="md" className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Title">
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Data Structures"
                autoFocus
              />
            </Field>
            <Field label="Code">
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="e.g. CS201"
              />
            </Field>
          </div>
          <Field label="Color">
            <div className="flex gap-1.5">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  aria-label={`Color ${c}`}
                  onClick={() => setColor(c)}
                  className={`size-6 rounded-full outline-none ${color === c ? "ring-ring ring-2 ring-offset-2" : ""}`}
                  style={{ background: c }}
                />
              ))}
            </div>
          </Field>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={submit}
              loading={edu.createCourse.isPending}
              disabled={!title.trim()}
            >
              Add course
            </Button>
          </div>
        </Card>
      ) : null}

      {courses.length === 0 && !open ? (
        <Text variant="body-s" tone="subtle">
          No courses yet.
        </Text>
      ) : (
        <div className="flex flex-wrap gap-2">
          {courses.map((c) => (
            <div
              key={c.id}
              className="border-border bg-surface flex items-center gap-2 rounded-md border py-1.5 pl-2.5 pr-1.5"
            >
              <span
                className="size-2.5 rounded-full"
                style={{ background: c.color || "var(--fg-subtle)" }}
              />
              <Text variant="body-s" className="font-medium">
                {c.title}
              </Text>
              {c.code ? (
                <Text variant="caption" tone="subtle">
                  {c.code}
                </Text>
              ) : null}
              <button
                type="button"
                aria-label={`Delete ${c.title}`}
                onClick={() => edu.deleteCourse.mutate({ id: c.id })}
                className="text-fg-subtle hover:text-danger"
              >
                <Trash2 size={13} aria-hidden />
              </button>
            </div>
          ))}
        </div>
      )}
    </Section>
  );
}

/* ── Add a class time ──────────────────────────────────────────────────────── */
function SessionAdder({
  edu,
  courses,
}: {
  edu: ReturnType<typeof useEducation>;
  courses: NonNullable<ReturnType<typeof useEducation>["list"]["data"]>["courses"];
}) {
  const [courseId, setCourseId] = useState("");
  const [weekday, setWeekday] = useState("1");
  const [start, setStart] = useState("09:00");
  const [end, setEnd] = useState("10:00");
  const [kind, setKind] = useState<(typeof KINDS)[number]>("lecture");
  const [location, setLocation] = useState("");

  if (courses.length === 0) return null;

  const submit = () => {
    if (!courseId) return;
    edu.createSession.mutate(
      {
        courseId,
        weekday: Number(weekday),
        startMinute: timeToMinutes(start),
        endMinute: timeToMinutes(end),
        kind,
        location: location.trim(),
      },
      { onSuccess: () => setLocation("") },
    );
  };

  return (
    <Card variant="section" padding="md" className="space-y-3">
      <MonoLabel tone="subtle">Add class time</MonoLabel>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Field label="Course">
          <Select value={courseId} onValueChange={setCourseId}>
            <SelectTrigger>
              <SelectValue placeholder="Pick a course" />
            </SelectTrigger>
            <SelectContent>
              {courses.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Day">
          <Select value={weekday} onValueChange={setWeekday}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {WEEK_ORDER.map((wd) => (
                <SelectItem key={wd} value={String(wd)}>
                  {WEEKDAYS[wd]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Type">
          <Select value={kind} onValueChange={(v) => setKind(v as (typeof KINDS)[number])}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {KINDS.map((k) => (
                <SelectItem key={k} value={k} className="capitalize">
                  {k}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Start">
          <Input type="time" value={start} onChange={(e) => setStart(e.target.value)} />
        </Field>
        <Field label="End">
          <Input type="time" value={end} onChange={(e) => setEnd(e.target.value)} />
        </Field>
        <Field label="Location">
          <Input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Room / building"
          />
        </Field>
      </div>
      <div className="flex justify-end">
        <Button
          size="sm"
          onClick={submit}
          loading={edu.createSession.isPending}
          disabled={!courseId || timeToMinutes(end) <= timeToMinutes(start)}
        >
          Add to timetable
        </Button>
      </div>
    </Card>
  );
}

/* ── Assignments ───────────────────────────────────────────────────────────── */
function AssignmentsSection({
  edu,
  courses,
  courseById,
}: {
  edu: ReturnType<typeof useEducation>;
  courses: NonNullable<ReturnType<typeof useEducation>["list"]["data"]>["courses"];
  courseById: Map<string, { title: string; color: string }>;
}) {
  const items = edu.list.data?.assignments ?? [];
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [courseId, setCourseId] = useState("");
  const [due, setDue] = useState("");

  const submit = () => {
    if (!title.trim()) return;
    edu.createAssignment.mutate(
      {
        title: title.trim(),
        courseId: courseId || null,
        dueAt: due ? new Date(due).toISOString() : null,
      },
      {
        onSuccess: () => {
          setTitle("");
          setDue("");
          setOpen(false);
        },
      },
    );
  };

  return (
    <Section
      icon={CalendarClock}
      title="Assignments"
      action={
        <Button
          size="sm"
          variant="secondary"
          leftIcon={<Plus size={14} />}
          onClick={() => setOpen((v) => !v)}
        >
          Add
        </Button>
      }
    >
      {open ? (
        <Card variant="section" padding="md" className="space-y-3">
          <Field label="Title">
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Problem set 3"
              autoFocus
            />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Course (optional)">
              <Select value={courseId} onValueChange={setCourseId}>
                <SelectTrigger>
                  <SelectValue placeholder="No course" />
                </SelectTrigger>
                <SelectContent>
                  {courses.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Due">
              <Input type="datetime-local" value={due} onChange={(e) => setDue(e.target.value)} />
            </Field>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={submit}
              loading={edu.createAssignment.isPending}
              disabled={!title.trim()}
            >
              Add assignment
            </Button>
          </div>
        </Card>
      ) : null}

      {items.length === 0 && !open ? (
        <Text variant="body-s" tone="subtle">
          No assignments.
        </Text>
      ) : (
        <div className="space-y-1.5">
          {items.map((a) => (
            <div
              key={a.id}
              className="border-border bg-surface flex items-center gap-3 rounded-md border px-3 py-2"
            >
              <div className="min-w-0 flex-1">
                <Text
                  variant="body-s"
                  className={
                    a.status === "graded" ? "font-medium line-through opacity-70" : "font-medium"
                  }
                >
                  {a.title}
                </Text>
                <Text variant="caption" tone="subtle">
                  {a.courseId ? (courseById.get(a.courseId)?.title ?? "—") : "General"} · due{" "}
                  {fmtDate(a.dueAt)}
                  {a.grade ? ` · ${a.grade}` : ""}
                </Text>
              </div>
              <Select
                value={a.status}
                onValueChange={(v) =>
                  edu.updateAssignment.mutate({
                    id: a.id,
                    status: v as (typeof ASSIGNMENT_STATUS)[number],
                  })
                }
              >
                <SelectTrigger className="h-8 w-[130px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ASSIGNMENT_STATUS.map((s) => (
                    <SelectItem key={s} value={s} className="capitalize">
                      {s.replace("_", " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <button
                type="button"
                aria-label={`Delete ${a.title}`}
                onClick={() => edu.deleteAssignment.mutate({ id: a.id })}
                className="text-fg-subtle hover:text-danger"
              >
                <Trash2 size={14} aria-hidden />
              </button>
            </div>
          ))}
        </div>
      )}
    </Section>
  );
}

/* ── Exams ─────────────────────────────────────────────────────────────────── */
function ExamsSection({
  edu,
  courses,
  courseById,
}: {
  edu: ReturnType<typeof useEducation>;
  courses: NonNullable<ReturnType<typeof useEducation>["list"]["data"]>["courses"];
  courseById: Map<string, { title: string; color: string }>;
}) {
  const items = edu.list.data?.exams ?? [];
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [courseId, setCourseId] = useState("");
  const [examAt, setExamAt] = useState("");
  const [location, setLocation] = useState("");

  const submit = () => {
    if (!title.trim() || !examAt) return;
    edu.createExam.mutate(
      {
        title: title.trim(),
        courseId: courseId || null,
        examAt: new Date(examAt).toISOString(),
        location: location.trim(),
      },
      {
        onSuccess: () => {
          setTitle("");
          setExamAt("");
          setLocation("");
          setOpen(false);
        },
      },
    );
  };

  return (
    <Section
      icon={GraduationCap}
      title="Exams"
      action={
        <Button
          size="sm"
          variant="secondary"
          leftIcon={<Plus size={14} />}
          onClick={() => setOpen((v) => !v)}
        >
          Add
        </Button>
      }
    >
      {open ? (
        <Card variant="section" padding="md" className="space-y-3">
          <Field label="Title">
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Midterm"
              autoFocus
            />
          </Field>
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Course (optional)">
              <Select value={courseId} onValueChange={setCourseId}>
                <SelectTrigger>
                  <SelectValue placeholder="No course" />
                </SelectTrigger>
                <SelectContent>
                  {courses.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="When">
              <Input
                type="datetime-local"
                value={examAt}
                onChange={(e) => setExamAt(e.target.value)}
              />
            </Field>
            <Field label="Location">
              <Input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Hall"
              />
            </Field>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={submit}
              loading={edu.createExam.isPending}
              disabled={!title.trim() || !examAt}
            >
              Add exam
            </Button>
          </div>
        </Card>
      ) : null}

      {items.length === 0 && !open ? (
        <Text variant="body-s" tone="subtle">
          No exams scheduled.
        </Text>
      ) : (
        <div className="space-y-1.5">
          {items.map((e) => (
            <div
              key={e.id}
              className="border-border bg-surface flex items-center gap-3 rounded-md border px-3 py-2"
            >
              <div className="min-w-0 flex-1">
                <Text variant="body-s" className="font-medium">
                  {e.title}
                </Text>
                <Text variant="caption" tone="subtle">
                  {e.courseId ? (courseById.get(e.courseId)?.title ?? "—") : "General"} ·{" "}
                  {fmtDateTime(e.examAt)}
                  {e.location ? ` · ${e.location}` : ""}
                </Text>
              </div>
              <button
                type="button"
                aria-label={`Delete ${e.title}`}
                onClick={() => edu.deleteExam.mutate({ id: e.id })}
                className="text-fg-subtle hover:text-danger"
              >
                <Trash2 size={14} aria-hidden />
              </button>
            </div>
          ))}
        </div>
      )}
    </Section>
  );
}

/* ── Advance-dated targets ─────────────────────────────────────────────────── */
function TargetsSection({ edu }: { edu: ReturnType<typeof useEducation> }) {
  const items = edu.list.data?.targets ?? [];
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [surfaceFrom, setSurfaceFrom] = useState("");
  const [category, setCategory] = useState("education");

  const submit = () => {
    if (!title.trim() || !targetDate) return;
    edu.createTarget.mutate(
      {
        title: title.trim(),
        targetDate,
        surfaceFrom: surfaceFrom || null,
        category,
        status: "active",
      },
      {
        onSuccess: () => {
          setTitle("");
          setTargetDate("");
          setSurfaceFrom("");
          setOpen(false);
        },
      },
    );
  };

  return (
    <Section
      icon={Target}
      title="Targets"
      action={
        <Button
          size="sm"
          variant="secondary"
          leftIcon={<Plus size={14} />}
          onClick={() => setOpen((v) => !v)}
        >
          Add
        </Button>
      }
    >
      <Text variant="caption" tone="subtle">
        Set a goal for a future date — it surfaces in Today as the date approaches.
      </Text>
      {open ? (
        <Card variant="section" padding="md" className="space-y-3">
          <Field label="Target">
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Finish portfolio site"
              autoFocus
            />
          </Field>
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Target date">
              <Input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
              />
            </Field>
            <Field label="Start showing from" hint="optional">
              <Input
                type="date"
                value={surfaceFrom}
                onChange={(e) => setSurfaceFrom(e.target.value)}
              />
            </Field>
            <Field label="Category">
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["education", "career", "personal"].map((c) => (
                    <SelectItem key={c} value={c} className="capitalize">
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={submit}
              loading={edu.createTarget.isPending}
              disabled={!title.trim() || !targetDate}
            >
              Add target
            </Button>
          </div>
        </Card>
      ) : null}

      {items.length === 0 && !open ? (
        <Text variant="body-s" tone="subtle">
          No targets set.
        </Text>
      ) : (
        <div className="space-y-1.5">
          {items.map((t) => (
            <div
              key={t.id}
              className="border-border bg-surface flex items-center gap-3 rounded-md border px-3 py-2"
            >
              <div className="min-w-0 flex-1">
                <Text
                  variant="body-s"
                  className={
                    t.status === "hit" ? "font-medium line-through opacity-70" : "font-medium"
                  }
                >
                  {t.title}
                </Text>
                <Text variant="caption" tone="subtle">
                  {fmtDate(t.targetDate)} · {t.category}
                </Text>
              </div>
              <Badge
                variant={t.status === "hit" ? "success" : "neutral"}
                size="sm"
                className="capitalize"
              >
                {t.status}
              </Badge>
              {t.status !== "hit" ? (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => edu.updateTarget.mutate({ id: t.id, status: "hit" })}
                >
                  Mark hit
                </Button>
              ) : null}
              <button
                type="button"
                aria-label={`Delete ${t.title}`}
                onClick={() => edu.deleteTarget.mutate({ id: t.id })}
                className="text-fg-subtle hover:text-danger"
              >
                <Trash2 size={14} aria-hidden />
              </button>
            </div>
          ))}
        </div>
      )}
    </Section>
  );
}
