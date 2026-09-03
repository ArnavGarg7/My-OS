"use client";

import { useMemo } from "react";
import { MonoLabel, Text } from "@myos/ui";
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

function PulseChip({ label, value, tone }: { label: string; value: string; tone: Tone }) {
  return (
    <div className="border-border bg-elevated/60 flex min-w-0 items-center gap-2.5 rounded-lg border px-3 py-2">
      <span aria-hidden className={`size-2 shrink-0 rounded-full ${BEAD[tone]}`} />
      <div className="flex min-w-0 flex-col">
        <MonoLabel tone="subtle">{label}</MonoLabel>
        <Text variant="body-s" truncate className="font-medium">
          {value}
        </Text>
      </div>
    </div>
  );
}

/**
 * Life / system pulse — a quiet multi-domain status strip. Every value is a real
 * count from the engines; a domain only appears when it has something to say.
 */
export function LifePulse({
  mission,
  readiness,
}: {
  mission: { rank: number; label: string }[];
  readiness: number | null;
}) {
  const counts = trpc.task.counts.useQuery();

  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(startOfDay);
  endOfDay.setDate(endOfDay.getDate() + 1);
  const events = trpc.calendar.list.useQuery({
    from: startOfDay.toISOString(),
    to: endOfDay.toISOString(),
  });

  const chips = useMemo(() => {
    const out: { label: string; value: string; tone: Tone }[] = [];
    if (readiness !== null) {
      out.push({
        label: "Readiness",
        value: `${readiness} / 100`,
        tone: readiness >= 66 ? "success" : readiness >= 40 ? "warning" : "danger",
      });
    }
    if (counts.data) {
      out.push({
        label: "Tasks",
        value: `${counts.data.open} open`,
        tone: counts.data.overdue > 0 ? "danger" : counts.data.open > 0 ? "accent" : "success",
      });
      if (counts.data.overdue > 0) {
        out.push({ label: "Overdue", value: `${counts.data.overdue}`, tone: "danger" });
      }
      if (counts.data.completed > 0) {
        out.push({
          label: "Done today",
          value: `${counts.data.completed}`,
          tone: "success",
        });
      }
    }
    if (events.data) {
      const upcoming = events.data.filter((e) => new Date(e.endAt).getTime() >= now.getTime());
      out.push({
        label: "Schedule",
        value: upcoming.length === 0 ? "Clear" : `${upcoming.length} left today`,
        tone: upcoming.length === 0 ? "success" : "info",
      });
    }
    if (mission.length > 0) {
      out.push({ label: "Mission", value: `${mission.length} priorities`, tone: "accent" });
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [counts.data, events.data, mission.length, readiness]);

  if (chips.length === 0) return null;

  return (
    <section className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
      {chips.map((c) => (
        <PulseChip key={c.label} {...c} />
      ))}
    </section>
  );
}
