"use client";

import Link from "next/link";
import { Badge, Text } from "@myos/ui";
import { trpc } from "@/lib/trpc/client";
import { formatCountdown, formatGain, formatMoney } from "@/components/resource/resource-icons";

/**
 * Morning Briefing resource slot (Sprint 4.3). The portfolio snapshot, what is renewing,
 * today's follow-ups and whose birthday is close — read-only; every value is derived by the
 * Resource platform on read.
 */
export function MorningResourceSection() {
  const summary = trpc.resource.summary.useQuery();
  const portfolio = trpc.resource.portfolio.useQuery();
  const health = trpc.resource.relationshipHealth.useQuery();

  const s = summary.data;
  const p = portfolio.data;
  const followUps = (health.data ?? []).filter((h) => h.followUpDue);

  return (
    <div className="flex flex-col gap-2">
      <Text variant="body-m">
        {s ? `Net worth ${formatMoney(s.netWorth)}` : "No resources tracked yet"}
        {s && s.investmentValue > 0 ? ` · investments ${formatMoney(s.investmentValue)}` : ""}
      </Text>

      {s && s.investmentValue > 0 ? (
        <Badge size="sm" variant={s.investmentGain >= 0 ? "success" : "danger"}>
          {formatGain(s.investmentGain)} on investments
        </Badge>
      ) : null}

      {p && p.upcomingRenewals.length > 0 ? (
        <div className="flex flex-col gap-1">
          <Text variant="caption" tone="subtle">
            UPCOMING RENEWALS
          </Text>
          {p.upcomingRenewals.slice(0, 3).map((r) => (
            <Text key={r.id} variant="caption">
              {r.name} — {formatCountdown(r.daysUntil)}
            </Text>
          ))}
        </div>
      ) : null}

      {followUps.length > 0 ? (
        <div className="flex flex-col gap-1">
          <Text variant="caption" tone="subtle">
            TODAY&apos;S FOLLOW-UPS
          </Text>
          {followUps.slice(0, 3).map((h) => (
            <Text key={h.relationshipId} variant="caption">
              {h.name}
            </Text>
          ))}
        </div>
      ) : null}

      {p && p.upcomingBirthdays.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2">
          {p.upcomingBirthdays.map((b) => (
            <Badge key={b.relationshipId} size="sm" variant="accent">
              🎂 {b.name} {formatCountdown(b.daysUntil)}
            </Badge>
          ))}
        </div>
      ) : null}

      {s && s.maintenanceOverdue > 0 ? (
        <Badge size="sm" variant="warning">
          {s.maintenanceOverdue} maintenance overdue
        </Badge>
      ) : null}
      {s && s.documentsExpiring > 0 ? (
        <Badge size="sm" variant="warning">
          {s.documentsExpiring} document{s.documentsExpiring === 1 ? "" : "s"} expiring
        </Badge>
      ) : null}

      <Link href="/resources" className="text-accent text-sm hover:underline">
        Open resources →
      </Link>
    </div>
  );
}
