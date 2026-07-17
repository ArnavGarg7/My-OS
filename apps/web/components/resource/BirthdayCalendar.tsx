"use client";

import { Badge, EmptyState, Text } from "@myos/ui";
import type { UpcomingDate } from "@myos/core/resource";
import { BirthdayIcon, formatCountdown } from "./resource-icons";

/**
 * BirthdayCalendar (Sprint 4.3). Birthdays and anniversaries, resolved against today by the
 * core. Relationships store a year-agnostic MM-DD, so the next occurrence is computed on
 * every read and can never drift out of sync.
 */
export function BirthdayCalendar({ dates }: { dates: UpcomingDate[] }) {
  if (dates.length === 0) {
    return (
      <EmptyState
        icon={BirthdayIcon}
        title="No dates yet"
        description="Add a birthday to a contact and it will appear here every year."
      />
    );
  }

  return (
    <ul className="flex flex-col gap-1">
      {dates.map((d) => (
        <li
          key={`${d.relationshipId}-${d.kind}`}
          className="border-border-subtle flex items-center justify-between rounded-md border px-3 py-2"
        >
          <span className="flex flex-col">
            <Text variant="body-s">{d.name}</Text>
            <Text variant="caption" tone="subtle">
              {d.kind} · {d.date}
            </Text>
          </span>
          <Badge size="sm" variant={d.daysUntil <= 7 ? "accent" : "neutral"}>
            {formatCountdown(d.daysUntil)}
          </Badge>
        </li>
      ))}
    </ul>
  );
}
