"use client";

import { Text } from "@myos/ui";
import { freeBusyHeadline } from "@myos/core/calendar";
import { trpc } from "@/lib/trpc/client";

function time(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

/**
 * Morning Briefing calendar hand-off (Sprint 2.7). Today's meetings, the first
 * meeting, and a deterministic free/deep-work recommendation — all sourced from
 * the Calendar Engine.
 */
export function MorningCalendarSection() {
  const summary = trpc.calendar.summary.useQuery({});
  const s = summary.data;

  if (!s) {
    return (
      <Text variant="body-s" tone="subtle">
        Loading your calendar…
      </Text>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <Text variant="body-m">
        {s.meetingCount === 0
          ? "No meetings today — the day is yours."
          : `${s.meetingCount} meeting${s.meetingCount === 1 ? "" : "s"} today${
              s.firstMeeting ? `, first at ${time(s.firstMeeting.startAt)}.` : "."
            }`}
      </Text>
      <Text variant="body-s" tone="muted">
        {freeBusyHeadline(s.freeBusy)}
      </Text>
    </div>
  );
}
