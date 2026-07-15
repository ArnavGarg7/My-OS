"use client";

import { Text } from "@myos/ui";
import type { Interval } from "@myos/core/calendar";

function time(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

const TONE: Record<string, string> = {
  meeting: "bg-info",
  busy: "bg-info",
  break: "bg-success",
  focus: "bg-accent",
  available: "bg-fg-subtle",
  personal: "bg-fg-subtle/50",
  working: "bg-fg-subtle",
};

/** Availability strip (Sprint 2.7). The day reduced to classified intervals. */
export function CalendarAvailability({ intervals }: { intervals: Interval[] }) {
  if (intervals.length === 0) {
    return (
      <Text variant="body-s" tone="subtle">
        No availability computed.
      </Text>
    );
  }
  return (
    <ul className="flex flex-col gap-1">
      {intervals
        .filter((i) => i.type !== "personal")
        .map((i, idx) => (
          <li key={idx} className="flex items-center gap-2">
            <span className="text-caption text-fg-subtle w-24 shrink-0 tabular-nums">
              {time(i.start)}–{time(i.end)}
            </span>
            <span
              aria-hidden
              className={`size-1.5 rounded-full ${TONE[i.type] ?? "bg-fg-subtle"}`}
            />
            <span className="text-body-s text-fg-muted">{i.label}</span>
          </li>
        ))}
    </ul>
  );
}
