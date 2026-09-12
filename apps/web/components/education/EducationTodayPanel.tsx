"use client";

import Link from "next/link";
import { CalendarClock, GraduationCap, Target } from "lucide-react";
import { Badge, Card, MonoLabel, Text } from "@myos/ui";
import { daysUntil } from "@myos/core/education";
import { trpc } from "@/lib/trpc/client";
import { todayDateIso } from "./use-education";

/**
 * Education in Today (Part E). Surfaces today's class blocks, the advance-dated targets whose window is
 * open, and the nearest due assignments/exams — so the day is built around the timetable. Renders
 * nothing when there's no college/internship data, so Today stays clean for non-students.
 */
function relativeDay(due: string | Date, todayIso: string): string {
  // dueAt/examAt arrive as ISO strings at runtime (no tRPC transformer) though typed Date — coerce.
  const dateIso = new Date(due).toISOString().slice(0, 10);
  const d = daysUntil(dateIso, todayIso);
  if (d < 0) return `${Math.abs(d)}d overdue`;
  if (d === 0) return "today";
  if (d === 1) return "tomorrow";
  return `in ${d}d`;
}

export function EducationTodayPanel() {
  const date = todayDateIso();
  const q = trpc.education.today.useQuery({ date }, { staleTime: 120_000 });
  const d = q.data;
  if (!d) return null;

  const hasAny =
    d.classes.length > 0 || d.targets.length > 0 || d.assignments.length > 0 || d.exams.length > 0;
  if (!hasAny) return null;

  return (
    <Card variant="insight" padding="md" className="space-y-3">
      <div className="flex items-center gap-2">
        <GraduationCap size={15} aria-hidden className="text-accent" />
        <MonoLabel tone="subtle">Education today</MonoLabel>
      </div>

      {d.classes.length > 0 ? (
        <div className="space-y-1.5">
          {d.classes.map((c) => (
            <div key={c.id} className="flex items-center gap-2.5">
              <Text variant="body-s" tone="muted" className="w-24 shrink-0 tabular-nums">
                {c.start}–{c.end}
              </Text>
              <span
                className="size-2 shrink-0 rounded-full"
                style={{ background: c.course?.color || "var(--accent)" }}
              />
              <Text variant="body-s" className="min-w-0 flex-1 truncate font-medium">
                {c.course?.title ?? "Class"}
              </Text>
              {c.location ? (
                <Text variant="caption" tone="subtle">
                  {c.location}
                </Text>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}

      {d.targets.length > 0 ? (
        <div className="space-y-1">
          {d.targets.map((t) => (
            <div key={t.id} className="flex items-center gap-2">
              <Target size={13} aria-hidden className="text-fg-subtle shrink-0" />
              <Text variant="body-s" className="min-w-0 flex-1 truncate">
                {t.title}
              </Text>
              <Badge variant="outline" size="sm">
                {relativeDay(t.targetDate, date)}
              </Badge>
            </div>
          ))}
        </div>
      ) : null}

      {d.assignments.length > 0 || d.exams.length > 0 ? (
        <div className="border-border/60 flex flex-wrap gap-x-4 gap-y-1 border-t pt-2">
          {d.assignments.map((a) => (
            <Link
              key={a.id}
              href="/college"
              className="text-fg-muted hover:text-fg flex items-center gap-1.5"
            >
              <CalendarClock size={12} aria-hidden />
              <Text variant="caption">
                {a.title} · {a.dueAt ? relativeDay(a.dueAt, date) : "due"}
              </Text>
            </Link>
          ))}
          {d.exams.map((e) => (
            <Link
              key={e.id}
              href="/college"
              className="text-fg-muted hover:text-fg flex items-center gap-1.5"
            >
              <GraduationCap size={12} aria-hidden />
              <Text variant="caption">
                {e.title} · {relativeDay(e.examAt, date)}
              </Text>
            </Link>
          ))}
        </div>
      ) : null}
    </Card>
  );
}
