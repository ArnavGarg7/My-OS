"use client";

import { Badge, Text } from "@myos/ui";
import { trpc } from "@/lib/trpc/client";
import { ResourceIcon, formatCountdown } from "@/components/resource/resource-icons";

/**
 * Tomorrow Studio resource planning (Sprint 4.3). Tomorrow's follow-ups, the maintenance
 * that is due and whether a financial review is owed. Read-only, derived from the Resource
 * platform — Tomorrow orchestrates; it owns nothing.
 */
export function TomorrowResource() {
  const summary = trpc.resource.summary.useQuery();
  const upcoming = trpc.resource.upcomingMaintenance.useQuery({ days: 7 });
  const signals = trpc.resource.signals.useQuery();

  const s = summary.data;
  if (!s) return null;

  const due = upcoming.data ?? [];
  const reviewDue = signals.data?.investmentReviewDue ?? false;

  return (
    <div className="border-border-subtle flex flex-col gap-2 rounded-md border px-3 py-2">
      <span className="inline-flex items-center gap-2">
        <ResourceIcon size={14} aria-hidden className="text-fg-subtle" />
        <Text variant="body-s">Resources for tomorrow</Text>
      </span>

      <div className="flex flex-wrap items-center gap-2">
        {s.followUpsDue > 0 ? (
          <Badge size="sm" variant="accent">
            {s.followUpsDue} follow-up{s.followUpsDue === 1 ? "" : "s"} due
          </Badge>
        ) : null}
        {due.length > 0 ? (
          <Badge size="sm" variant="warning">
            {due.length} maintenance this week
          </Badge>
        ) : null}
        {s.maintenanceOverdue > 0 ? (
          <Badge size="sm" variant="danger">
            {s.maintenanceOverdue} overdue
          </Badge>
        ) : null}
        {reviewDue ? (
          <Badge size="sm" variant="neutral">
            Financial review due
          </Badge>
        ) : null}
        {s.nextBirthday ? (
          <Badge size="sm" variant="accent">
            🎂 {s.nextBirthday}
          </Badge>
        ) : null}
      </div>

      {due.length > 0 ? (
        <div className="flex flex-col gap-0.5">
          {due.slice(0, 3).map((m) => (
            <Text key={m.id} variant="caption" tone="subtle">
              {m.title} ({m.assetName}) — {formatCountdown(m.daysUntilDue)}
            </Text>
          ))}
        </div>
      ) : null}

      {s.upcomingRenewals > 0 ? (
        <Text variant="caption" tone="subtle">
          {s.upcomingRenewals} renewal{s.upcomingRenewals === 1 ? "" : "s"} in the next 30 days —
          worth a slot this week.
        </Text>
      ) : null}
    </div>
  );
}
