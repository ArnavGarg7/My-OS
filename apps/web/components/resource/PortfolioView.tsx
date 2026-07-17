"use client";

import { Badge, EmptyState, Text } from "@myos/ui";
import type { InvestmentPortfolio } from "@myos/core/resource";
import { InvestmentIcon, formatGain, formatMoney } from "./resource-icons";

/**
 * PortfolioView (Sprint 4.3). Allocation + gains, read-only. Every number is derived from
 * user-entered prices by the core — there is no market feed behind any of this.
 */
export function PortfolioView({ portfolio }: { portfolio: InvestmentPortfolio | undefined }) {
  if (!portfolio || portfolio.positions.length === 0) {
    return (
      <EmptyState
        icon={InvestmentIcon}
        title="No investments yet"
        description="Add a holding and enter its price to see allocation and gains."
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="border-border-subtle flex flex-wrap items-center gap-4 rounded-md border px-3 py-2">
        <div>
          <Text variant="caption" tone="subtle">
            Market value
          </Text>
          <Text variant="body-m">{formatMoney(portfolio.marketValue)}</Text>
        </div>
        <div>
          <Text variant="caption" tone="subtle">
            Cost basis
          </Text>
          <Text variant="body-m">{formatMoney(portfolio.costBasis)}</Text>
        </div>
        <div>
          <Text variant="caption" tone="subtle">
            Gain
          </Text>
          <Text variant="body-m">
            {formatGain(portfolio.gain)} ({portfolio.gainPercent}%)
          </Text>
        </div>
        {portfolio.unbalanced && portfolio.concentratedIn ? (
          <Badge size="sm" variant="warning">
            Concentrated in {portfolio.concentratedIn.replace("_", " ")}
          </Badge>
        ) : null}
      </div>

      <div className="flex flex-col gap-2">
        <Text variant="caption" tone="subtle">
          ALLOCATION
        </Text>
        {portfolio.allocation.map((slice) => (
          <div key={slice.type} className="flex items-center gap-2">
            <span className="w-28 shrink-0">
              <Text variant="caption">{slice.type.replace("_", " ")}</Text>
            </span>
            <div className="bg-surface-subtle h-2 flex-1 overflow-hidden rounded-full">
              <div
                className="bg-accent h-full rounded-full"
                style={{ width: `${Math.round(slice.share * 100)}%` }}
              />
            </div>
            <span className="w-24 shrink-0 text-right">
              <Text variant="caption" tone="subtle">
                {Math.round(slice.share * 100)}% · {formatMoney(slice.value)}
              </Text>
            </span>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-1">
        <Text variant="caption" tone="subtle">
          POSITIONS
        </Text>
        {portfolio.positions.map((p) => (
          <div
            key={p.positionId}
            className="border-border-subtle flex items-center justify-between border-b py-1 last:border-0"
          >
            <span className="inline-flex items-center gap-2">
              <Text variant="body-s">{p.symbol}</Text>
              <Text variant="caption" tone="subtle">
                {p.quantity} units
              </Text>
            </span>
            <span className="inline-flex items-center gap-3">
              <Text variant="caption" tone="subtle">
                {formatMoney(p.marketValue)}
              </Text>
              <Badge size="sm" variant={p.gain >= 0 ? "success" : "danger"}>
                {formatGain(p.gain)}
              </Badge>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
