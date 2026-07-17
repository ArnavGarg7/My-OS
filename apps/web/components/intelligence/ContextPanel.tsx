"use client";

import { Badge, StatBlock, Text } from "@myos/ui";
import { trpc } from "@/lib/trpc/client";
import { ATTENTION_LABEL, ATTENTION_TONE, DashboardIcon, TREND_GLYPH } from "./intelligence-icons";

/**
 * Intelligence context panel (Sprint 4.4). Route-aware snapshot on /dashboard — the overall
 * life score, each area's trend, what needs attention and how many reviews are due. Read-only;
 * everything recomputes server-side on fetch.
 */
export function IntelligenceContextPanel() {
  const portfolio = trpc.intelligence.portfolio.useQuery();
  const attention = trpc.intelligence.attention.useQuery();
  const statistics = trpc.intelligence.statistics.useQuery();

  const p = portfolio.data;
  const items = attention.data ?? [];
  const stats = statistics.data;

  return (
    <div className="flex flex-col gap-4 p-4">
      <span className="inline-flex items-center gap-1.5">
        <DashboardIcon size={14} aria-hidden className="text-fg-subtle" />
        <Text variant="heading-s">Life overview</Text>
      </span>

      {p ? (
        <div className="grid grid-cols-2 gap-2">
          <StatBlock label="Overall" value={String(p.overall)} />
          <StatBlock label="Strongest" value={p.strongest} />
          <StatBlock label="Weakest" value={p.weakest} />
          <StatBlock label="Balance" value={p.imbalanced ? "Uneven" : "Even"} />
        </div>
      ) : null}

      {p ? (
        <div className="flex flex-col gap-1">
          <Text variant="caption" tone="subtle">
            LIFE AREAS
          </Text>
          {p.areas.map((a) => (
            <div key={a.area} className="flex items-center justify-between gap-2">
              <Text variant="caption">{a.label}</Text>
              <span className="inline-flex items-center gap-1">
                <Text variant="caption" tone="subtle">
                  {a.score} {TREND_GLYPH[a.trend]}
                </Text>
                <Badge size="sm" variant={ATTENTION_TONE[a.level]}>
                  {a.trend}
                </Badge>
              </span>
            </div>
          ))}
        </div>
      ) : null}

      {items.length > 0 ? (
        <div className="flex flex-col gap-1">
          <Text variant="caption" tone="subtle">
            ATTENTION
          </Text>
          {items.slice(0, 5).map((i) => (
            <div key={i.id} className="flex items-center justify-between gap-2">
              <Text variant="caption">{i.title}</Text>
              <Badge size="sm" variant={ATTENTION_TONE[i.level]}>
                {ATTENTION_LABEL[i.level]}
              </Badge>
            </div>
          ))}
        </div>
      ) : null}

      {stats ? (
        <Text variant="caption" tone="subtle">
          {stats.areasImproving} improving · {stats.areasDeclining} declining ·{" "}
          {stats.milestonesUpcoming} milestones · {stats.achievementsUnlocked} achievements ·{" "}
          {stats.reviewsDue} reviews due
        </Text>
      ) : null}
    </div>
  );
}
