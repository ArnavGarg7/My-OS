"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  ListChecks,
  Sparkles,
  Timer,
} from "lucide-react";
import { Badge, Button, Card, MonoLabel, Text } from "@myos/ui";
import { PRIORITY_WEIGHT, parseTask, type TaskPriority } from "@myos/core/task";
import { trpc, type RouterOutputs } from "@/lib/trpc/client";

type NowData = RouterOutputs["chief"]["now"];

/* ── Next-action mapping ──────────────────────────────────────────────────── */

const ACTION_ROUTE: Record<string, { href: string; label: string; icon: typeof Timer }> = {
  start_focus: { href: "/focus", label: "Start focus session", icon: Timer },
  start_block: { href: "/planner", label: "Start this block", icon: Timer },
  take_break: { href: "/today", label: "Take a break", icon: CheckCircle2 },
  reschedule: { href: "/planner", label: "Rescue my day", icon: CalendarDays },
  review: { href: "/today", label: "Review decisions", icon: ListChecks },
  plan: { href: "/tomorrow", label: "Plan my day", icon: CalendarDays },
};

const CONFIDENCE_TONE: Record<string, "success" | "accent" | "warning" | "neutral"> = {
  very_high: "success",
  high: "success",
  medium: "accent",
  low: "warning",
};

function confidenceLabel(level: string) {
  const t = level.replace(/_/g, " ");
  return `${t.charAt(0).toUpperCase()}${t.slice(1)} confidence`;
}

/** The dominant surface: the single next action, with its primary control. */
export function NextActionHero({ data }: { data: NowData }) {
  const [showWhy, setShowWhy] = useState(false);
  const rec = data.recommendation;
  const route = ACTION_ROUTE[rec.action] ?? { href: "/today", label: "Continue", icon: ArrowRight };
  const Icon = route.icon;

  return (
    <Card variant="hero" padding="lg" className="relative overflow-hidden">
      <div
        aria-hidden
        className="from-accent via-accent-hover absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r to-transparent"
      />
      <div className="flex flex-col gap-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span className="bg-accent-muted text-accent-fg rounded px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.08em]">
                Next action
              </span>
              {rec.ref?.module ? (
                <>
                  <span className="text-fg-disabled" aria-hidden>
                    /
                  </span>
                  <MonoLabel tone="muted">{rec.ref.module}</MonoLabel>
                </>
              ) : null}
            </div>
            <Text variant="heading-xl" className="tracking-tight" asChild>
              <h2>{rec.title}</h2>
            </Text>
            <Text variant="body-m" tone="muted" className="max-w-xl">
              {rec.explanation.recommendation}
            </Text>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1.5">
            {rec.estimateMinutes !== null ? (
              <span className="text-accent-fg inline-flex items-center gap-1.5 font-mono text-sm font-semibold tabular-nums">
                <Timer size={14} aria-hidden className="animate-pulse-soft" />
                {rec.estimateMinutes}m
              </span>
            ) : null}
            <Badge variant={CONFIDENCE_TONE[rec.confidence] ?? "neutral"} size="sm">
              {confidenceLabel(rec.confidence)}
            </Badge>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="flex flex-wrap items-center gap-2">
            <Button asChild leftIcon={<Icon size={15} aria-hidden />}>
              <Link href={route.href}>{route.label}</Link>
            </Button>
            <Button variant="secondary" onClick={() => setShowWhy((s) => !s)}>
              {showWhy ? "Hide reasoning" : "Explain"}
            </Button>
          </div>
          {data.provider.provider !== "local" ? (
            <MonoLabel tone="subtle">via {data.provider.provider}</MonoLabel>
          ) : (
            <MonoLabel tone="subtle" bead>
              grounded · local
            </MonoLabel>
          )}
        </div>

        {showWhy ? (
          <div className="border-border bg-inset/60 flex flex-col gap-3 rounded-lg border p-4">
            <ExplRow label="Situation" value={rec.explanation.situation} />
            <ExplRow label="Recommendation" value={rec.explanation.recommendation} />
            {rec.explanation.alternatives.length > 0 ? (
              <ExplRow label="Alternatives" value={rec.explanation.alternatives.join(" · ")} />
            ) : null}
            <ExplRow label="Cost of ignoring" value={rec.explanation.costOfIgnoring} />
          </div>
        ) : null}
      </div>
    </Card>
  );
}

function ExplRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <MonoLabel tone="subtle">{label}</MonoLabel>
      <Text variant="body-s">{value}</Text>
    </div>
  );
}

/** One restrained Chief-of-Staff observation, tied to an action. */
export function ChiefInsight({ data }: { data: NowData }) {
  const [dismissed, setDismissed] = useState(false);
  const rec = data.recommendation;
  const note = data.notifications[0];
  const body = note?.body ?? rec.explanation.situation;
  const heading = note?.title ?? "On your day right now";
  if (dismissed || !body) return null;

  return (
    <Card variant="insight" padding="lg">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="bg-accent-muted text-accent flex size-8 shrink-0 items-center justify-center rounded-lg">
            <Sparkles size={15} aria-hidden />
          </span>
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <MonoLabel tone="accent">Chief of Staff</MonoLabel>
              <span className="text-fg-disabled" aria-hidden>
                ·
              </span>
              <MonoLabel tone="subtle">{heading}</MonoLabel>
            </div>
            <Text variant="body-m">{body}</Text>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2 self-end sm:self-center">
          <Button variant="ghost" size="sm" onClick={() => setDismissed(true)}>
            Dismiss
          </Button>
          <Button asChild variant="secondary" size="sm">
            <Link href="/chief">Open Chief</Link>
          </Button>
        </div>
      </div>
    </Card>
  );
}

/* ── Today's schedule ─────────────────────────────────────────────────────── */

export function ScheduleColumn() {
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  const events = trpc.calendar.list.useQuery({
    from: start.toISOString(),
    to: end.toISOString(),
  });

  const upcoming = useMemo(
    () =>
      (events.data ?? [])
        .filter((e) => new Date(e.endAt).getTime() >= now.getTime())
        .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime())
        .slice(0, 5),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [events.data],
  );

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarDays size={15} aria-hidden className="text-accent-fg" />
          <Text variant="heading-m">Today's schedule</Text>
        </div>
        <Link
          href="/calendar"
          className="text-fg-subtle hover:text-fg text-body-s inline-flex items-center gap-0.5"
        >
          Calendar <ChevronRight size={13} aria-hidden />
        </Link>
      </div>

      {events.isLoading ? (
        <Card padding="md">
          <Text variant="body-s" tone="subtle">
            Loading your day…
          </Text>
        </Card>
      ) : upcoming.length === 0 ? (
        <Card padding="md" className="border-dashed">
          <Text variant="body-s" tone="subtle">
            Nothing left on the calendar today. The rest of your time is yours.
          </Text>
        </Card>
      ) : (
        <div className="flex flex-col gap-1.5">
          {upcoming.map((e) => (
            <div
              key={e.id}
              className="border-border bg-elevated hover:bg-overlay flex items-center gap-3 rounded-lg border p-3 transition-colors"
            >
              <div className="w-16 shrink-0">
                <MonoLabel tone="accent">
                  {e.allDay
                    ? "All day"
                    : new Date(e.startAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                </MonoLabel>
              </div>
              <span aria-hidden className="bg-info h-7 w-0.5 shrink-0 rounded-full" />
              <div className="flex min-w-0 flex-col">
                <Text variant="body-m" truncate className="font-medium">
                  {e.title}
                </Text>
                {e.location ? (
                  <Text variant="caption" tone="subtle" truncate>
                    {e.location}
                  </Text>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

/* ── Core priorities ──────────────────────────────────────────────────────── */

const PRIORITY_TONE: Record<TaskPriority, "danger" | "warning" | "info" | "neutral"> = {
  urgent: "danger",
  high: "warning",
  medium: "info",
  low: "neutral",
};

export function PrioritiesColumn() {
  const utils = trpc.useUtils();
  const list = trpc.task.list.useQuery({ limit: 60 });
  const complete = trpc.task.complete.useMutation({
    onSuccess: () => {
      void utils.task.list.invalidate();
      void utils.task.counts.invalidate();
    },
  });
  const create = trpc.task.create.useMutation({
    onSuccess: () => {
      void utils.task.list.invalidate();
      void utils.task.counts.invalidate();
    },
  });

  const [draft, setDraft] = useState("");
  const parsed = useMemo(() => (draft.trim() ? parseTask(draft, new Date()) : null), [draft]);

  const top = useMemo(() => {
    return (list.data ?? [])
      .filter(
        (t) => t.status === "not_started" || t.status === "in_progress" || t.status === "blocked",
      )
      .sort((a, b) => {
        const w = PRIORITY_WEIGHT[b.priority] - PRIORITY_WEIGHT[a.priority];
        if (w !== 0) return w;
        const ad = a.dueAt ? new Date(a.dueAt).getTime() : Infinity;
        const bd = b.dueAt ? new Date(b.dueAt).getTime() : Infinity;
        return ad - bd;
      })
      .slice(0, 4);
  }, [list.data]);

  const submit = () => {
    if (!parsed || parsed.title === "Untitled task") return;
    create.mutate({
      title: parsed.title,
      priority: parsed.priority,
      ...(parsed.estimatedMinutes !== null ? { estimatedMinutes: parsed.estimatedMinutes } : {}),
      ...(parsed.dueAt !== null ? { dueAt: parsed.dueAt } : {}),
    });
    setDraft("");
  };

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ListChecks size={15} aria-hidden className="text-accent-fg" />
          <Text variant="heading-m">Core priorities</Text>
        </div>
        <Link
          href="/tasks"
          className="text-fg-subtle hover:text-fg text-body-s inline-flex items-center gap-0.5"
        >
          All tasks <ChevronRight size={13} aria-hidden />
        </Link>
      </div>

      <div className="flex flex-col gap-1.5">
        {list.isLoading ? (
          <Card padding="md">
            <Text variant="body-s" tone="subtle">
              Loading priorities…
            </Text>
          </Card>
        ) : top.length === 0 ? (
          <Card padding="md" className="border-dashed">
            <Text variant="body-s" tone="subtle">
              No open tasks. Capture the next thing on your mind below.
            </Text>
          </Card>
        ) : (
          top.map((t) => (
            <div
              key={t.id}
              className="border-border bg-elevated hover:bg-overlay group flex items-center gap-3 rounded-lg border p-3 transition-colors"
            >
              <button
                type="button"
                aria-label={`Complete ${t.title}`}
                onClick={() => complete.mutate({ id: t.id })}
                disabled={complete.isPending}
                className="border-border-strong hover:border-success hover:text-success flex size-4 shrink-0 items-center justify-center rounded-[4px] border text-transparent transition-colors"
              >
                <CheckCircle2 size={12} aria-hidden />
              </button>
              <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex items-center gap-2">
                  <Text variant="body-m" truncate className="font-medium">
                    {t.title}
                  </Text>
                  <Badge variant={PRIORITY_TONE[t.priority]} size="sm" className="uppercase">
                    {t.priority}
                  </Badge>
                </div>
                {t.dueAt ? (
                  <Text variant="caption" tone="subtle">
                    Due{" "}
                    {new Date(t.dueAt).toLocaleString([], {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </Text>
                ) : null}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Inline quick capture — real parser, honest about what it reads. */}
      <div className="flex flex-col gap-1.5">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
          }}
          placeholder="Capture a task — e.g. Draft report tomorrow 2h urgent"
          aria-label="Quick capture a task"
          className="border-border bg-inset text-fg placeholder:text-fg-subtle focus:border-accent focus-visible:ring-ring text-body-s w-full rounded-lg border px-3 py-2 outline-none transition-colors focus-visible:ring-1"
        />
        {parsed && parsed.title !== "Untitled task" ? (
          <div className="flex flex-wrap items-center gap-1.5 px-1">
            <MonoLabel tone="subtle">Interpreted</MonoLabel>
            <Badge variant="outline" size="sm">
              {parsed.title}
            </Badge>
            <Badge variant={PRIORITY_TONE[parsed.priority]} size="sm" className="uppercase">
              {parsed.priority}
            </Badge>
            {parsed.dueAt ? (
              <Badge variant="outline" size="sm">
                due{" "}
                {new Date(parsed.dueAt).toLocaleDateString([], { month: "short", day: "numeric" })}
              </Badge>
            ) : null}
            {parsed.estimatedMinutes ? (
              <Badge variant="outline" size="sm">
                {parsed.estimatedMinutes}m
              </Badge>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}
