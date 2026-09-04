"use client";

import { useMemo } from "react";
import Link from "next/link";
import { MonoLabel, Skeleton, Text } from "@myos/ui";
import { selectActionable } from "@myos/core/decision";
import { trpc } from "@/lib/trpc/client";

type Tone = "accent" | "info" | "success" | "warning" | "danger" | "muted";

const BEAD: Record<Tone, string> = {
  accent: "bg-accent",
  info: "bg-info",
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
  muted: "bg-fg-subtle",
};

interface Chip {
  label: string;
  value: string;
  tone: Tone;
  href: string;
}

function PulseChip({ label, value, tone, href }: Chip) {
  return (
    <Link
      href={href}
      className="border-border bg-elevated/60 hover:bg-overlay hover:border-border-strong focus-visible:ring-ring group flex min-w-0 items-center gap-2.5 rounded-lg border px-3 py-2 outline-none transition-colors focus-visible:ring-2"
    >
      <span aria-hidden className={`size-2 shrink-0 rounded-full ${BEAD[tone]}`} />
      <div className="flex min-w-0 flex-col">
        <MonoLabel tone="subtle">{label}</MonoLabel>
        <Text variant="body-s" truncate className="group-hover:text-fg font-medium">
          {value}
        </Text>
      </div>
    </Link>
  );
}

/**
 * System pulse — a calm strip of real, at-a-glance system state. Every chip is a
 * live count from an engine and a one-click jump to where you act on it. A
 * domain only appears once its query has resolved with something worth showing.
 */
export function SystemPulse({
  readiness,
  missionCount,
}: {
  readiness: number | null;
  missionCount: number;
}) {
  const counts = trpc.task.counts.useQuery();
  const inbox = trpc.inbox.countNew.useQuery();
  const focus = trpc.focus.summary.useQuery();
  const decisions = trpc.today.listDecisions.useQuery({});

  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(startOfDay);
  endOfDay.setDate(endOfDay.getDate() + 1);
  const events = trpc.calendar.list.useQuery({
    from: startOfDay.toISOString(),
    to: endOfDay.toISOString(),
  });

  const loading =
    counts.isLoading ||
    inbox.isLoading ||
    focus.isLoading ||
    decisions.isLoading ||
    events.isLoading;

  const chips = useMemo<Chip[]>(() => {
    const out: Chip[] = [];

    if (readiness !== null) {
      out.push({
        label: "Readiness",
        value: `${readiness} / 100`,
        tone: readiness >= 66 ? "success" : readiness >= 40 ? "warning" : "danger",
        href: "/health",
      });
    }

    if (counts.data) {
      out.push({
        label: "Tasks",
        value: counts.data.open === 0 ? "All clear" : `${counts.data.open} open`,
        tone: counts.data.overdue > 0 ? "danger" : counts.data.open > 0 ? "accent" : "success",
        href: "/tasks",
      });
      if (counts.data.overdue > 0) {
        out.push({
          label: "Overdue",
          value: `${counts.data.overdue} task${counts.data.overdue === 1 ? "" : "s"}`,
          tone: "danger",
          href: "/tasks",
        });
      }
    }

    if (typeof inbox.data === "number" && inbox.data > 0) {
      out.push({
        label: "Inbox",
        value: `${inbox.data} to sort`,
        tone: "accent",
        href: "/inbox",
      });
    }

    if (events.data) {
      const upcoming = events.data.filter((e) => new Date(e.endAt).getTime() >= now.getTime());
      out.push({
        label: "Schedule",
        value: upcoming.length === 0 ? "Clear" : `${upcoming.length} ahead`,
        tone: upcoming.length === 0 ? "success" : "info",
        href: "/calendar",
      });
    }

    if (focus.data) {
      out.push({
        label: "Focus",
        value: focus.data.active
          ? `${focus.data.remainingMinutes}m left`
          : focus.data.deepWorkMinutesToday > 0
            ? `${focus.data.deepWorkMinutesToday}m today`
            : "Not started",
        tone: focus.data.active
          ? "success"
          : focus.data.deepWorkMinutesToday > 0
            ? "info"
            : "muted",
        href: "/focus",
      });
    }

    if (decisions.data) {
      const actionable = selectActionable(decisions.data, now).length;
      out.push({
        label: "Decisions",
        value: actionable === 0 ? "Reviewed" : `${actionable} to review`,
        tone: actionable > 0 ? "warning" : "muted",
        href: "/today#morning-recommendation",
      });
    }

    if (missionCount > 0) {
      out.push({
        label: "Mission",
        value: `${missionCount} priorit${missionCount === 1 ? "y" : "ies"}`,
        tone: "accent",
        href: "/today#morning-plan",
      });
    }

    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [counts.data, inbox.data, focus.data, decisions.data, events.data, readiness, missionCount]);

  if (loading && chips.length === 0) {
    return (
      <section className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-[52px] rounded-lg" />
        ))}
      </section>
    );
  }

  if (chips.length === 0) return null;

  return (
    <section className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-6">
      {chips.slice(0, 6).map((c) => (
        <PulseChip key={c.label} {...c} />
      ))}
    </section>
  );
}
