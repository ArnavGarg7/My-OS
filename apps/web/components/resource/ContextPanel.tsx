"use client";

import { Badge, StatBlock, Text } from "@myos/ui";
import { trpc } from "@/lib/trpc/client";
import {
  ResourceIcon,
  STRENGTH_LABEL,
  STRENGTH_TONE,
  formatCountdown,
  formatGain,
  formatMoney,
} from "./resource-icons";

/**
 * Resource context panel (Sprint 4.3). Route-aware snapshot on /resources — the derived
 * portfolio, what is renewing, who is due a follow-up and which birthdays are close.
 * Read-only; every number is recomputed server-side on each fetch.
 */
export function ResourceContextPanel() {
  const portfolio = trpc.resource.portfolio.useQuery();
  const investments = trpc.resource.investmentPortfolio.useQuery();
  const health = trpc.resource.relationshipHealth.useQuery();
  const statistics = trpc.resource.statistics.useQuery();

  const p = portfolio.data;
  const inv = investments.data;
  const followUps = (health.data ?? []).filter((h) => h.followUpDue);
  const weakest = (health.data ?? []).slice(0, 3);

  return (
    <div className="flex flex-col gap-4 p-4">
      <span className="inline-flex items-center gap-1.5">
        <ResourceIcon size={14} aria-hidden className="text-fg-subtle" />
        <Text variant="heading-s">Resources</Text>
      </span>

      {p ? (
        <div className="grid grid-cols-2 gap-2">
          <StatBlock label="Net worth" value={formatMoney(p.netWorth)} />
          <StatBlock label="Investments" value={formatMoney(p.investmentValue)} />
          <StatBlock label="Assets" value={formatMoney(p.assetValue)} />
          <StatBlock label="Liabilities" value={formatMoney(p.liabilities)} />
        </div>
      ) : null}

      {inv && inv.costBasis > 0 ? (
        <div className="flex flex-wrap items-center gap-2">
          <Badge size="sm" variant={inv.gain >= 0 ? "success" : "danger"}>
            {formatGain(inv.gain)} ({inv.gainPercent}%)
          </Badge>
          {inv.unbalanced && inv.concentratedIn ? (
            <Badge size="sm" variant="warning">
              Concentrated in {inv.concentratedIn.replace("_", " ")}
            </Badge>
          ) : null}
        </div>
      ) : null}

      {p && p.upcomingRenewals.length > 0 ? (
        <div className="flex flex-col gap-1">
          <Text variant="caption" tone="subtle">
            RENEWALS
          </Text>
          {p.upcomingRenewals.slice(0, 4).map((r) => (
            <div key={r.id} className="flex items-center justify-between gap-2">
              <Text variant="caption">{r.name}</Text>
              <Badge size="sm" variant={r.expired ? "danger" : "warning"}>
                {formatCountdown(r.daysUntil)}
              </Badge>
            </div>
          ))}
        </div>
      ) : null}

      {p && p.documentsExpiring.length > 0 ? (
        <div className="flex flex-col gap-1">
          <Text variant="caption" tone="subtle">
            DOCUMENTS EXPIRING
          </Text>
          {p.documentsExpiring.slice(0, 3).map((d) => (
            <div key={d.id} className="flex items-center justify-between gap-2">
              <Text variant="caption">{d.name}</Text>
              <Badge size="sm" variant={d.expired ? "danger" : "warning"}>
                {formatCountdown(d.daysUntil)}
              </Badge>
            </div>
          ))}
        </div>
      ) : null}

      {p && p.upcomingBirthdays.length > 0 ? (
        <div className="flex flex-col gap-1">
          <Text variant="caption" tone="subtle">
            BIRTHDAYS
          </Text>
          {p.upcomingBirthdays.map((b) => (
            <div key={b.relationshipId} className="flex items-center justify-between gap-2">
              <Text variant="caption">{b.name}</Text>
              <Badge size="sm" variant="accent">
                {formatCountdown(b.daysUntil)}
              </Badge>
            </div>
          ))}
        </div>
      ) : null}

      {followUps.length > 0 ? (
        <div className="flex flex-col gap-1">
          <Text variant="caption" tone="subtle">
            FOLLOW-UPS DUE
          </Text>
          {followUps.map((h) => (
            <Text key={h.relationshipId} variant="caption">
              {h.name}
            </Text>
          ))}
        </div>
      ) : null}

      {weakest.length > 0 ? (
        <div className="flex flex-col gap-1">
          <Text variant="caption" tone="subtle">
            NEEDS ATTENTION
          </Text>
          {weakest.map((h) => (
            <div key={h.relationshipId} className="flex items-center justify-between gap-2">
              <Text variant="caption">{h.name}</Text>
              <Badge size="sm" variant={STRENGTH_TONE[h.strength]}>
                {STRENGTH_LABEL[h.strength]}
              </Badge>
            </div>
          ))}
        </div>
      ) : null}

      {statistics.data ? (
        <Text variant="caption" tone="subtle">
          {statistics.data.assetCount} assets · {statistics.data.policyCount} policies ·{" "}
          {statistics.data.documentCount} documents · {statistics.data.documentHealth}% document
          health
        </Text>
      ) : null}
    </div>
  );
}
