"use client";

import { Timer } from "lucide-react";
import { Text } from "@myos/ui";
import { trpc } from "@/lib/trpc/client";

/**
 * Morning Briefing focus slot (Sprint 3.2). A quick read on deep-work momentum —
 * yesterday's deep work + longest session and today's focus so far. Read-only; the
 * numbers derive from focus sessions. Focus Mode itself is where the work happens.
 */
function fmt(minutes: number): string {
  const m = Math.round(minutes);
  if (m < 60) return `${m}m`;
  return `${Math.floor(m / 60)}h ${m % 60}m`;
}

export function MorningFocusSection() {
  const summary = trpc.focus.summary.useQuery();
  const metrics = trpc.focus.metrics.useQuery();
  const s = summary.data;
  const m = metrics.data;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <Timer size={16} aria-hidden className="text-fg-subtle" />
        <Text variant="body-m">
          {s ? `${fmt(s.deepWorkMinutesToday)} deep work today` : "No focus sessions yet"}
        </Text>
      </div>
      {m && m.longestSessionMinutes > 0 ? (
        <Text variant="caption" tone="subtle">
          Longest session {fmt(m.longestSessionMinutes)} · {m.completedSessions} completed ·{" "}
          {m.interruptions} interruptions
        </Text>
      ) : (
        <Text variant="body-s" tone="subtle">
          Start a focus session to build deep-work momentum.
        </Text>
      )}
    </div>
  );
}
