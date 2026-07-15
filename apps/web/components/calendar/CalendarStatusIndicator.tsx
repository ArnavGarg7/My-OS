"use client";

import { trpc } from "@/lib/trpc/client";

function time(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

/**
 * Status-bar calendar indicator (Sprint 2.7): "Calendar · 3 meetings · Next
 * 09:30 · synced". Provider-driven via the summary query.
 */
export function CalendarStatusIndicator() {
  const summary = trpc.calendar.summary.useQuery({}, { refetchInterval: 60_000 });
  const s = summary.data;
  const count = s?.meetingCount ?? 0;

  return (
    <div className="flex items-center gap-1.5">
      <span
        aria-hidden
        className={`size-1.5 rounded-full ${count > 0 ? "bg-info" : "bg-fg-subtle"}`}
      />
      <span className="text-fg-subtle">Calendar</span>
      <span className="text-fg-muted font-medium">
        {count} meeting{count === 1 ? "" : "s"}
      </span>
      {s?.nextEvent ? (
        <span className="text-fg-muted">Next {time(s.nextEvent.startAt)}</span>
      ) : null}
    </div>
  );
}
